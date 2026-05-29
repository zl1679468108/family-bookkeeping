import React, { useState, useCallback, useRef, useEffect } from 'react';
import { APILoader, Map, Marker } from '@uiw/react-amap';
import { Button } from '../ui/button';
import type { LocationResult } from '../../types/map';
import './index.scss';

const AnyMap = Map as any;
const AnyMarker = Marker as any;

// 高德 JS API 2.0 安全密钥配置（必须在 SDK 加载前设置）
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
  visible,
  onClose,
  onConfirm,
  initialLocation,
}) => {
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(
    initialLocation && initialLocation.latitude !== 0
      ? [initialLocation.longitude, initialLocation.latitude]
      : null
  );
  const [selectedAddress, setSelectedAddress] = useState<string>(initialLocation?.locationName || '');
  const [poiId, setPoiId] = useState<string | null>(initialLocation?.poiId || null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const mapRef = useRef<any>(null);

  // 定位到当前位置
  const handleLocate = useCallback(() => {
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.Geolocation) {
      setSearchError('定位功能不可用');
      return;
    }
    setSearchError('');
    const geo = new AMapWin.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
    geo.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete' && result.position) {
        const pos: [number, number] = [result.position.lng, result.position.lat];
        setSelectedPos(pos);
        const map = mapRef.current?.map;
        if (map) { map.setCenter(pos); map.setZoom(15); }
        // 逆地理编码获取地址
        const geocoder = new AMapWin.Geocoder({});
        geocoder.getAddress(pos, (gs: string, gr: any) => {
          if (gs === 'complete' && gr.regeocode) {
            const addr = gr.regeocode.formattedAddress;
            setSelectedAddress(addr);
            if (gr.regeocode.pois?.[0]) {
              const p = gr.regeocode.pois[0];
              setPoiId(p.id || null);
            }
          }
        });
      } else {
        // 定位失败，回退到北京
        const beijing: [number, number] = [116.397428, 39.90923];
        setSelectedPos(null);
        const map = mapRef.current?.map;
        if (map) { map.setCenter(beijing); map.setZoom(11); }
        setSearchError('定位失败，已切换到北京。请确认浏览器已授权位置权限或手动搜索');
      }
    });
  }, []);

  // 弹窗打开时自动定位（地图创建完成后触发，不抢跑）
  useEffect(() => {
    if (!visible || selectedPos) return;
    // 等地图实例就绪再定位
    const timer = setInterval(() => {
      if (mapRef.current?.map && (window as any).AMap?.Geolocation) {
        clearInterval(timer);
        handleLocate();
      }
    }, 200);
    const timeout = setTimeout(() => clearInterval(timer), 8000);
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [visible, handleLocate]);

  const amapKey = process.env.REACT_APP_AMAP_KEY || '';

  // 逆地理编码
  const reverseGeocode = useCallback((lng: number, lat: number) => {
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.Geocoder) return;
    const geocoder = new AMapWin.Geocoder({});
    geocoder.getAddress([lng, lat], (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        const address = result.regeocode.formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setSelectedAddress(address);
        if (result.regeocode.pois && result.regeocode.pois.length > 0) {
          const nearestPoi = result.regeocode.pois[0];
          setPoiId(nearestPoi.id || null);
          if (nearestPoi.name && nearestPoi.name !== address) {
            setSelectedAddress(nearestPoi.name + ' ' + address);
          }
        }
      }
    });
  }, []);

  const handleMapClick = useCallback((e: any) => {
    const lng = e.lnglat.getLng();
    const lat = e.lnglat.getLat();
    setSelectedPos([lng, lat]);
    reverseGeocode(lng, lat);
  }, [reverseGeocode]);

  // 搜索地址
  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.PlaceSearch) return;

    setSearching(true);
    setSearchError('');
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
        setSearchError(status === 'complete' ? '未找到匹配的地点' : '搜索失败，请重试');
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
    setSearchError('');
  };

  if (!visible) return null;

  return (
    <div className="location-picker-overlay" onClick={onClose}>
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

        {searchError && <div className="location-picker-error">{searchError}</div>}

        <div className="location-picker-map">
          <APILoader akey={amapKey} version="2.0" plugins={['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.Geolocation']}>
            <AnyMap
              ref={mapRef}
              center={selectedPos || [116.397428, 39.90923]}
              zoom={selectedPos ? 16 : 11}
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
