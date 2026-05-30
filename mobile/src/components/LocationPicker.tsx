/**
 * LocationPicker — Full-screen map panel using Amap (高德地图) JS API 2.0.
 * Features:
 * - Full-screen map with center crosshair marker
 * - Top search box using AMap.PlaceSearch
 * - Bottom address display
 * - Confirm / Skip buttons
 * - Graceful fallback when AMap SDK fails to load
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { LocationInfo } from '../types';

interface LocationPickerProps {
  visible: boolean;
  onConfirm: (location: LocationInfo) => void;
  onSkip: () => void;
  amapKey?: string;
  amapVersion?: string;
}

/** Global promise to track AMap SDK loading */
let amapLoadPromise: Promise<void> | null = null;
let amapLoaded = false;

const loadAmap = (key: string, version: string): Promise<void> => {
  if (amapLoaded) return Promise.resolve();
  if (amapLoadPromise) return amapLoadPromise;

  amapLoadPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('AMap SDK load timeout'));
    }, 15000);

    (window as unknown as Record<string, unknown>)._onAmapLoad = () => {
      clearTimeout(timeout);
      amapLoaded = true;
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=${version}&key=${key}&callback=_onAmapLoad`;
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('AMap SDK script load error'));
    };
    document.head.appendChild(script);
  });

  return amapLoadPromise;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onConfirm,
  onSkip,
  amapKey = import.meta.env.VITE_AMAP_KEY || '',
  amapVersion = '2.0',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const geocoderRef = useRef<unknown>(null);
  const placeSearchRef = useRef<unknown>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [currentLocation, setCurrentLocation] = useState<LocationInfo>({
    name: '定位中...',
    address: '',
    lat: 0,
    lng: 0,
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [sdkError, setSdkError] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Initialize AMap
  useEffect(() => {
    if (!visible) return;

    loadAmap(amapKey, amapVersion)
      .then(() => initMap())
      .catch(() => {
        setSdkError(true);
      });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { destroy?: () => void }).destroy?.();
        mapRef.current = null;
      }
    };
  }, [visible]);

  const initMap = useCallback(() => {
    if (!mapContainerRef.current) return;

    const AMap = (window as unknown as Record<string, unknown>).AMap as Record<string, unknown>;
    if (!AMap) {
      setSdkError(true);
      return;
    }

    // Create map
    const map = new (AMap.Map as new (el: HTMLElement, opts: Record<string, unknown>) => unknown)(
      mapContainerRef.current,
      {
        zoom: 15,
        resizeEnable: true,
      },
    );
    mapRef.current = map;

    // Create geocoder
    const Geocoder = AMap.Geocoder as new (opts?: Record<string, unknown>) => unknown;
    geocoderRef.current = new Geocoder({});

    // Create place search
    const PlaceSearch = AMap.PlaceSearch as new (opts?: Record<string, unknown>) => unknown;
    placeSearchRef.current = new PlaceSearch({
      pageSize: 10,
      pageIndex: 1,
    });

    // Get current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          (map as { setCenter?: (pos: [number, number]) => void }).setCenter?.([lng, lat]);
          reverseGeocode(lng, lat);
        },
        () => {
          // Default to a center point if geolocation fails
          (map as { setCenter?: (pos: [number, number]) => void }).setCenter?.([116.397428, 39.90923]);
          reverseGeocode(116.397428, 39.90923);
        },
        { timeout: 5000 },
      );
    } else {
      (map as { setCenter?: (pos: [number, number]) => void }).setCenter?.([116.397428, 39.90923]);
      reverseGeocode(116.397428, 39.90923);
    }

    // Listen for map move end to update center address
    (map as { on?: (event: string, cb: () => void) => void }).on?.('moveend', () => {
      const center = (map as { getCenter?: () => { lng: number; lat: number } }).getCenter?.();
      if (center) {
        reverseGeocode(center.lng, center.lat);
      }
    });

    setMapReady(true);
  }, []);

  const reverseGeocode = useCallback((lng: number, lat: number) => {
    const geocoder = geocoderRef.current as {
      getAddress?: (
        pos: [number, number],
        cb: (status: string, result: { regeocode: { formattedAddress: string; addressComponent: Record<string, unknown> } }) => void,
      ) => void;
    } | null;
    if (!geocoder?.getAddress) return;

    geocoder.getAddress([lng, lat], (_status, result) => {
      if (result?.regeocode) {
        const addr = result.regeocode;
        const comp = addr.addressComponent as Record<string, string>;
        const name =
          (comp.streetNumber || '') +
          (comp.street || '') ||
          addr.formattedAddress ||
          '未知位置';
        setCurrentLocation({
          name: name || addr.formattedAddress,
          address: addr.formattedAddress,
          lat,
          lng,
        });
      }
    });
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchKeyword.trim() || !placeSearchRef.current) return;

    const ps = placeSearchRef.current as {
      search?: (
        keyword: string,
        cb: (status: string, result: { poiCount: { count: number }; pois: Array<{ name: string; pname: string; cityname: string; adname: string; address: string; location: { lng: number; lat: number } }> }) => void,
      ) => void;
    };

    ps.search?.(searchKeyword, (_status, result) => {
      if (result?.pois) {
        const pois: LocationInfo[] = (result.pois as Array<{
          name: string;
          address: string;
          location: { lng: number; lat: number };
        }>).map((poi) => ({
          name: poi.name,
          address: poi.address,
          lat: poi.location.lat,
          lng: poi.location.lng,
        }));
        setSearchResults(pois);
      }
    });
  }, [searchKeyword]);

  const handleSelectResult = (loc: LocationInfo) => {
    const map = mapRef.current as { setCenter?: (pos: [number, number]) => void } | null;
    map?.setCenter?.([loc.lng, loc.lat]);
    setCurrentLocation(loc);
    setSearchResults([]);
    setSearchKeyword('');
  };

  if (!visible) return null;

  // SDK load error fallback
  if (sdkError) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-8">
            <p className="text-text-secondary mb-4">地图服务暂不可用</p>
            <p className="text-xs text-text-secondary mb-6">请检查高德地图 SDK 配置或网络连接</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onSkip}
                className="px-6 py-2 rounded-xl border border-gray-200 text-text-secondary text-sm"
              >
                跳过
              </button>
              <button
                onClick={() => {
                  setSdkError(false);
                  setMapReady(false);
                  amapLoadPromise = null;
                  amapLoaded = false;
                  loadAmap(amapKey, amapVersion)
                    .then(() => initMap())
                    .catch(() => setSdkError(true));
                }}
                className="px-6 py-2 rounded-xl bg-primary text-white text-sm"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 bg-white z-10">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={searchRef}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索地点..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-sm border-none outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-primary text-white text-sm rounded-xl active:bg-primary-light"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Center crosshair */}
        {mapReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#0F6E56" strokeWidth="2" opacity="0.3" />
              <circle cx="16" cy="16" r="3" fill="#0F6E56" />
              <line x1="16" y1="0" x2="16" y2="8" stroke="#0F6E56" strokeWidth="2" />
              <line x1="16" y1="24" x2="16" y2="32" stroke="#0F6E56" strokeWidth="2" />
              <line x1="0" y1="16" x2="8" y2="16" stroke="#0F6E56" strokeWidth="2" />
              <line x1="24" y1="16" x2="32" y2="16" stroke="#0F6E56" strokeWidth="2" />
            </svg>
          </div>
        )}

        {/* Search results overlay */}
        {searchResults.length > 0 && (
          <div className="absolute top-2 left-4 right-4 bg-white rounded-2xl shadow-lg max-h-60 overflow-y-auto z-10">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-b-0 active:bg-gray-50"
              >
                <p className="text-sm font-medium truncate">{result.name}</p>
                <p className="text-xs text-text-secondary truncate">{result.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current address info */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <p className="text-sm font-medium truncate">{currentLocation.name}</p>
        <p className="text-xs text-text-secondary truncate">{currentLocation.address}</p>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 safe-bottom flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-text-secondary text-sm font-medium active:bg-gray-50"
        >
          跳过
        </button>
        <button
          onClick={() => onConfirm(currentLocation)}
          disabled={currentLocation.lat === 0 && currentLocation.lng === 0}
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium active:bg-primary-light disabled:bg-gray-300"
        >
          确认位置
        </button>
      </div>
    </div>
  );
};

export default LocationPicker;
