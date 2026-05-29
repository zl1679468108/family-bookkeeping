import React, { useState, useCallback, useRef, useEffect } from 'react';
import { APILoader, Map, Marker } from '@uiw/react-amap';
import { Button } from '../ui/button';
import type { LocationResult } from '../../types/map';
import './index.scss';

const AnyMap = Map as any;
const AnyMarker = Marker as any;

const scode = process.env.REACT_APP_AMAP_SECRET;
if (scode && typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = { securityJsCode: scode };
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
  initialLocation?: LocationResult | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible, onClose, onConfirm, initialLocation,
}) => {
  /* ---- state ---- */
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [poiId, setPoiId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  /* ---- refs ---- */
  const mapRef = useRef<any>(null);
  const initDone = useRef(false);   // 本次弹窗是否已初始化（每次打开重置）
  const locating = useRef(false);   // doLocate 防重入锁

  const hasInitialPos = !!(initialLocation && initialLocation.latitude !== 0);

  /* ---- 弹窗显隐时重置 ---- */
  useEffect(() => {
    if (!visible) return;
    initDone.current = false;
    locating.current = false;
    setSearchText('');
    setError('');

    if (hasInitialPos && initialLocation) {
      setSelectedPos([initialLocation.longitude, initialLocation.latitude]);
      setSelectedAddress(initialLocation.locationName);
      setPoiId(initialLocation.poiId);
    } else {
      setSelectedPos(null);
      setSelectedAddress('');
      setPoiId(null);
    }
  }, [visible, hasInitialPos, initialLocation]);

  /* ====== 定位（自动 + 手动共用）====== */
  const doLocate = useCallback(() => {
    if (locating.current) return;
    const AMapWin = (window as any).AMap;
    const map = mapRef.current?.map;
    if (!map || !AMapWin?.Geolocation) { setError('定位功能不可用'); return; }
    setError('');
    locating.current = true;
    const geo = new AMapWin.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
    geo.getCurrentPosition((status: string, result: any) => {
      locating.current = false;
      if (status === 'complete' && result.position) {
        const pos: [number, number] = [result.position.lng, result.position.lat];
        setSelectedPos(pos);
        if (map) { map.setCenter(pos); map.setZoom(15); }
        const geocoder = new AMapWin.Geocoder({});
        geocoder.getAddress(pos, (gs: string, gr: any) => {
          if (gs === 'complete' && gr.regeocode) {
            setSelectedAddress(gr.regeocode.formattedAddress);
            if (gr.regeocode.pois?.[0]) {
              setPoiId(gr.regeocode.pois[0].id || null);
            }
          }
        });
      } else {
        setError('无法获取当前位置，请确认已授权位置权限后手动搜索或点击地图选择位置');
      }
    });
  }, []);

  /* ---- 弹窗打开 + 地图就绪 → 初始化（有点位回显/定位当前位置） ---- */
  useEffect(() => {
    if (!visible || initDone.current) return;

    // 轮询等 map 实例就绪
    const check = setInterval(() => {
      const map = mapRef.current?.map;
      if (!map) return;
      clearInterval(check);
      initDone.current = true;

      if (hasInitialPos && initialLocation) {
        map.setCenter([initialLocation.longitude, initialLocation.latitude]);
        map.setZoom(16);
      } else {
        doLocate();
      }
    }, 100);
    return () => clearInterval(check);
  }, [visible, hasInitialPos, initialLocation, doLocate]);

  /* ====== 逆地理编码 ====== */
  const reverseGeocode = useCallback((lng: number, lat: number) => {
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.Geocoder) return;
    const geocoder = new AMapWin.Geocoder({});
    geocoder.getAddress([lng, lat], (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        const address = result.regeocode.formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSelectedAddress(address);
        if (result.regeocode.pois?.[0]) {
          const p = result.regeocode.pois[0];
          setPoiId(p.id || null);
          if (p.name && p.name !== address) setSelectedAddress(p.name + ' ' + address);
        }
      }
    });
  }, []);

  /* ====== 交互回调 ====== */
  const handleMapClick = useCallback((e: any) => {
    const pos: [number, number] = [e.lnglat.getLng(), e.lnglat.getLat()];
    setSelectedPos(pos);
    reverseGeocode(pos[0], pos[1]);
  }, [reverseGeocode]);

  const handleLocate = doLocate;

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.PlaceSearch) return;
    setSearching(true);
    setError('');
    const placeSearch = new AMapWin.PlaceSearch({ pageSize: 10, pageIndex: 1, city: '全国' });
    placeSearch.search(searchText, (status: string, result: any) => {
      setSearching(false);
      if (status === 'complete' && result.poiList?.pois?.length > 0) {
        const poi = result.poiList.pois[0];
        const lng = poi.location.lng ?? poi.location.getLng();
        const lat = poi.location.lat ?? poi.location.getLat();
        const pos: [number, number] = [lng, lat];
        setSelectedPos(pos);
        setSelectedAddress(poi.name + ' ' + (poi.address || ''));
        setPoiId(poi.id || null);
        const map = mapRef.current?.map;
        if (map) { map.setCenter(pos); map.setZoom(15); }
      } else {
        setError(status === 'complete' ? '未找到匹配的地点' : '搜索失败，请重试');
      }
    });
  }, [searchText]);

  const handleConfirm = () => {
    if (!selectedPos || !selectedAddress) return;
    onConfirm({ latitude: selectedPos[1], longitude: selectedPos[0], locationName: selectedAddress, poiId });
    reset();
    onClose();
  };

  const handleClear = () => {
    onConfirm({ latitude: 0, longitude: 0, locationName: '', poiId: null });
    reset();
    onClose();
  };

  const reset = () => {
    setSelectedPos(null);
    setSelectedAddress('');
    setPoiId(null);
    setSearchText('');
    setError('');
  };

  const amapKey = process.env.REACT_APP_AMAP_KEY || '';

  return (
    <div className={`location-picker-overlay${visible ? '' : ' hidden'}`} onClick={visible ? onClose : undefined}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="location-picker-header">
          <h3>选择消费位置</h3>
          <button className="location-picker-close" onClick={onClose}>✕</button>
        </div>

        <div className="location-picker-search">
          <input
            type="text" className="location-search-input"
            placeholder="搜索地址或商户名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="secondary" onClick={handleSearch} disabled={searching}>
            {searching ? '搜索中...' : '搜索'}
          </Button>
          <Button variant="secondary" onClick={handleLocate} title="定位到当前位置" style={{ padding: '0 10px' }}>
            📍
          </Button>
        </div>

        {error && <div className="location-picker-error">{error}</div>}

        <div className="location-picker-map">
          <APILoader akey={amapKey} version="2.0" plugins={['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.Geolocation']}>
            <AnyMap
              ref={mapRef}
              onClick={handleMapClick}
              style={{ width: '100%', height: '100%' }}
            >
              {selectedPos && <AnyMarker position={selectedPos} />}
            </AnyMap>
          </APILoader>
        </div>

        {selectedAddress ? (
          <div className="location-picker-info">
            <span className="location-picker-info-icon">📍</span>
            <span className="location-picker-info-text">{selectedAddress}</span>
          </div>
        ) : (
          <div className="location-picker-hint">在地图上点击选择位置，或使用搜索查找地址</div>
        )}

        <div className="location-picker-footer">
          <Button variant="secondary" onClick={handleClear}>清除位置</Button>
          <div className="location-picker-actions">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button onClick={handleConfirm} disabled={!selectedPos}>确认位置</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
