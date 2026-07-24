import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '../../../../components/ui/Button';
import { FooterActions } from '../../../../components/ui/FooterActions';
import { GlobalModal } from '../../../../components/GlobalModal';
import type { LocationResult } from '@family-bookkeeping/shared-types'
import { useMapInstance } from '../../../../hooks/useMapInstance';
import { AmapManager } from '../../../../services/amapManager';
import './index.scss';
import { FORM_SEARCH_LOCATION, FORM_LOCATION_GET_FAILED_HINT,
  FORM_LOCATION_MAP_HINT,
} from '../../../../utils/formCopy'
import { TITLE_SELECT_LOCATION, TITLE_LOCATE_CURRENT } from '../../../../utils/sectionCopy'
import { ACTION_CANCEL, searchingLabel } from '../../../../utils/actionCopy'
import { ERROR_LOCATION_UNAVAILABLE, ERROR_LOCATION_NO_MATCH, ERROR_LOCATION_SEARCH_FAILED } from '../../../../utils/errorCopy'

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
  const initDone = useRef(false);
  const locating = useRef(false);

  const hasInitialPos = !!(initialLocation && initialLocation.latitude !== 0);

  /* ---- Map instance via pool (active only when visible) ---- */
  const { mapContainerRef, map: rawMap, ready } = useMapInstance(
    'location-picker',
    {},
    visible,
  );
  const map = rawMap as any;

  // Sync AMap instance to stable ref for imperative access
  const mapRef = useRef<any>(null);
  mapRef.current = map;

  /* ---- Imperative marker for selected position ---- */
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap) return;

    // Remove old marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    if (selectedPos) {
      markerRef.current = new AMap.Marker({
        position: selectedPos,
        map,
      });
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [selectedPos, map]);

  /* ---- 逆地理编码 ---- */
  const reverseGeocode = useCallback((lng: number, lat: number) => {
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap?.Geocoder) return;
    const geocoder = new AMap.Geocoder({ radius: 200, extensions: 'all' });
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

  /* ---- Map click handler (imperative event binding) ---- */
  useEffect(() => {
    if (!map) return;

    const clickHandler = (e: any) => {
      const pos: [number, number] = [e.lnglat.getLng(), e.lnglat.getLat()];
      setSelectedPos(pos);
      reverseGeocode(pos[0], pos[1]);
    };

    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [map, reverseGeocode]);

  /* ---- Resize map when modal becomes visible ---- */
  useEffect(() => {
    if (!visible || !map) return;
    const timer = setTimeout(() => {
      if (map && typeof map.resize === 'function') {
        map.resize();
      }
    }, 300);
    const timer2 = setTimeout(() => {
      if (map && typeof map.resize === 'function') {
        map.resize();
      }
    }, 600);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [visible, map]);

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
    const AMap = AmapManager.getInstance().AMap;
    const m = mapRef.current;
    if (!m || !AMap?.Geolocation) { setError(ERROR_LOCATION_UNAVAILABLE); return; }
    setError('');
    locating.current = true;
    const geo = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
    geo.getCurrentPosition((status: string, result: any) => {
      locating.current = false;
      if (status === 'complete' && result.position) {
        const pos: [number, number] = [result.position.lng, result.position.lat];
        setSelectedPos(pos);
        if (m) { m.setCenter(pos); m.setZoom(15); }
        reverseGeocode(pos[0], pos[1]);
      } else {
        setError(FORM_LOCATION_GET_FAILED_HINT);
      }
    });
  }, [reverseGeocode]);

  /* ---- 弹窗打开 + 地图就绪 → 初始化 ---- */
  useEffect(() => {
    if (!visible || !ready || !map || initDone.current) return;
    initDone.current = true;

    if (hasInitialPos && initialLocation) {
      map.setCenter([initialLocation.longitude, initialLocation.latitude]);
      map.setZoom(16);
    } else {
      doLocate();
    }
  }, [visible, ready, map, hasInitialPos, initialLocation, doLocate]);

  /* ====== 交互回调 ====== */
  const handleLocate = doLocate;

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap?.PlaceSearch) return;
    setSearching(true);
    setError('');
    const placeSearch = new AMap.PlaceSearch({ pageSize: 10, pageIndex: 1, city: '全国' });
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
        const m = mapRef.current;
        if (m) { m.setCenter(pos); m.setZoom(15); }
      } else {
        setError(status === 'complete' ? ERROR_LOCATION_NO_MATCH : ERROR_LOCATION_SEARCH_FAILED);
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

  const modalFooter = (
    <div className="location-picker-footer">
      <Button variant="secondary" onClick={handleClear}>清除位置</Button>
      <FooterActions align="end">
        <Button variant="secondary" onClick={onClose}>{ACTION_CANCEL}</Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!selectedPos || !selectedAddress}
        >
          确认位置
        </Button>
      </FooterActions>
    </div>
  );

  return (
    <GlobalModal
      open={visible}
      onClose={onClose}
      type="modal"
      title={TITLE_SELECT_LOCATION}
      size="lg"
      closeOnMask={false}
      footer={modalFooter}
      className="location-picker-modal"
      bodyClassName="location-picker-body"
    >
      <div className="location-picker-search">
        <input
          type="text" className="location-search-input"
          placeholder={FORM_SEARCH_LOCATION}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="secondary" onClick={handleSearch} disabled={searching}>
          {searchingLabel(searching)}
        </Button>
        <Button variant="secondary" onClick={handleLocate} title={TITLE_LOCATE_CURRENT} style={{ padding: '0 10px' }}>
          📍
        </Button>
      </div>

      {error && <div className="location-picker-error">{error}</div>}

      <div className="location-picker-map" style={{ height: '350px', minHeight: '350px' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {selectedAddress ? (
        <div className="location-picker-info">
          <span className="location-picker-info-icon">📍</span>
          <span className="location-picker-info-text">{selectedAddress}</span>
        </div>
      ) : (
        <div className="location-picker-hint">{FORM_LOCATION_MAP_HINT}</div>
      )}
    </GlobalModal>
  );
};
