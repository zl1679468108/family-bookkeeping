import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { APILoader, Map, Marker, InfoWindow } from '@uiw/react-amap';
import type { MapTransaction, MerchantSummary } from '../../types/map';
import { getCategoryColor } from '../../utils/categoryColors';
import { formatAmountWithType } from '../../utils/common';
import { useCategoryLookup } from '../../hooks/useCategories';
import './index.scss';

interface MapCanvasProps {
  data: MapTransaction[];
  merchants: MerchantSummary[];
  loading: boolean;
  viewMode: 'marker' | 'heatmap' | 'merchant-map';
}

const AnyMap = Map as any;
const AnyMarker = Marker as any;
const AnyInfoWindow = InfoWindow as any;

// 高德 JS API 2.0 安全密钥配置
const scode = process.env.REACT_APP_AMAP_SECRET;
if (scode && typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = { securityJsCode: scode };
}

function createMarkerContent(category: string, amount: number, maxAmount: number): string {
  const color = getCategoryColor(category);
  const minSize = 8;
  const maxSize = 32;
  const size = maxAmount > 0
    ? minSize + (amount / maxAmount) * (maxSize - minSize)
    : 12;
  const clamped = Math.min(Math.max(size, minSize), maxSize);
  return `
    <div style="
      width: ${clamped}px;
      height: ${clamped}px;
      border-radius: 50%;
      background: ${color};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>
  `;
}

function createMerchantContent(totalAmount: number, maxAmount: number): string {
  const minSize = 16;
  const maxSize = 48;
  const ratio = maxAmount > 0 ? totalAmount / maxAmount : 0.2;
  const size = minSize + ratio * (maxSize - minSize);
  const opacity = 0.5 + ratio * 0.5;
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(238,102,102,${opacity});
      border: 2px solid rgba(238,102,102,0.8);
      box-shadow: 0 2px 8px rgba(238,102,102,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${Math.max(10, size / 3)}px;
      font-weight: bold;
    ">¥</div>
  `;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ data, merchants, loading, viewMode }) => {
  const [activeItem, setActiveItem] = useState<MapTransaction | MerchantSummary | null>(null);
  const [activeType, setActiveType] = useState<'transaction' | 'merchant'>('transaction');
  const [infoPos, setInfoPos] = useState<[number, number] | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef<any>(null);
  const hasLocated = useRef(false);
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  // 定位到当前位置
  const handleLocate = useCallback(() => {
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.Geolocation) return;
    const geo = new AMapWin.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
    geo.getCurrentPosition((status: string, result: any) => {
      const map = mapRef.current?.map;
      if (!map) return;
      if (status === 'complete' && result.position) {
        map.setCenter([result.position.lng, result.position.lat]);
        map.setZoom(15);
      } else {
        // 定位失败，回退到北京
        map.setCenter([116.397428, 39.90923]);
        map.setZoom(11);
      }
    });
  }, []);

  // 自动定位到当前位置（只在首次加载时触发一次）
  useEffect(() => {
    if (hasLocated.current) return;
    const timer = setInterval(() => {
      if (mapRef.current?.map && (window as any).AMap?.Geolocation) {
        clearInterval(timer);
        hasLocated.current = true;
        handleLocate();
      }
    }, 200);
    const timeout = setTimeout(() => { clearInterval(timer); hasLocated.current = true; }, 8000);
    return () => { clearInterval(timer); clearTimeout(timeout); };
  }, [handleLocate]);

  const center: [number, number] = useMemo(() => {
    if (data.length === 0 && merchants.length === 0) return [116.397428, 39.90923];
    const points = viewMode === 'merchant-map'
      ? data // 商户视图用交易数据算中心
      : data;
    if (points.length === 0) return [116.397428, 39.90923];
    const avgLng = points.reduce((sum, t) => sum + t.longitude, 0) / points.length;
    const avgLat = points.reduce((sum, t) => sum + t.latitude, 0) / points.length;
    return [avgLng, avgLat];
  }, [data, viewMode]);

  const maxAmount = useMemo(() => {
    if (viewMode === 'merchant-map') {
      return merchants.reduce((max, m) => Math.max(max, m.total_amount), 0);
    }
    return data.reduce((max, t) => Math.max(max, Number(t.amount)), 0);
  }, [data, merchants, viewMode]);

  // 热力图效果
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    const map = mapRef.current?.map;
    if (!map || data.length === 0) return;

    const AMapWin = (window as any).AMap;
    if (!AMapWin?.HeatMap) return;

    // 清除已有热力图
    const existingLayers = map.getLayers?.() || [];
    existingLayers.forEach((layer: any) => {
      if (layer?.CLASS_NAME === 'AMap.HeatMap') map.remove(layer);
    });

    const heatmapData = data.map((t) => ({
      lng: t.longitude,
      lat: t.latitude,
      count: Math.max(1, Math.floor(Number(t.amount) / 10)),
    }));

    const heatmap = new AMapWin.HeatMap(map, {
      radius: 40,
      opacity: [0, 0.8],
      gradient: { 0.2: '#91CC75', 0.4: '#FAC858', 0.6: '#EE6666', 0.8: '#9A60B4', 1.0: '#9A60B4' },
    });
    heatmap.setDataSet({ data: heatmapData, max: 100 });

    return () => {
      const map = mapRef.current?.map;
      if (map) {
        const layers = map.getLayers?.() || [];
        layers.forEach((layer: any) => {
          if (layer?.CLASS_NAME === 'AMap.HeatMap') {
            map.remove(layer);
          }
        });
      }
    };
  }, [viewMode, data]);

  const handleMarkerClick = useCallback(
    (item: MapTransaction, pos: [number, number]) => {
      setActiveItem(item);
      setActiveType('transaction');
      setInfoPos(pos);
    },
    []
  );

  const handleMerchantClick = useCallback(
    (merchant: MerchantSummary, idx: number) => {
      // 查找该商户的交易获取坐标
      const tx = data.find((t) => t.location_name === merchant.location_name);
      const pos: [number, number] = tx
        ? [tx.longitude, tx.latitude]
        : [116.397428, 39.90923];
      setActiveItem(merchant);
      setActiveType('merchant');
      setInfoPos(pos);
    },
    [data]
  );

  const handleInfoClose = useCallback(() => {
    setActiveItem(null);
    setInfoPos(null);
  }, []);

  // POI 搜索
  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.PlaceSearch) return;
    setSearching(true);
    const placeSearch = new AMapWin.PlaceSearch({
      pageSize: 20,
      pageIndex: 1,
      city: '全国',
    });
    placeSearch.search(searchText, (status: string, result: any) => {
      setSearching(false);
      if (status === 'complete' && result.poiList?.pois) {
        setSearchResults(result.poiList.pois);
      }
    });
  }, [searchText]);

  const handleSearchResultClick = useCallback((poi: any) => {
    const pos: [number, number] = [poi.location.lng, poi.location.lat];
    if (mapRef.current?.map) {
      mapRef.current.map.setCenter(pos);
      mapRef.current.map.setZoom(16);
    }
  }, []);

  // 点击地图关闭搜索列表
  const handleMapClick = useCallback(() => {
    setSearchResults([]);
  }, []);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="map-loading-spinner" />
        <span>加载数据中...</span>
      </div>
    );
  }

  const amapKey = process.env.REACT_APP_AMAP_KEY || '';

  return (
    <div className="map-canvas-wrapper">
      {/* POI 搜索栏 */}
      <div className="map-search-overlay">
        <input
          type="text"
          className="map-search-input"
          placeholder="搜索附近商户..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="map-search-btn" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : '🔍'}
        </button>
        <button className="map-search-btn map-locate-btn" onClick={handleLocate} title="定位到当前位置">
          📍
        </button>
        {/* 搜索结果列表 */}
        {searchResults.length > 0 && (
          <div className="map-search-results">
            {searchResults.map((poi: any, i: number) => {
              const hasData = data.some((t) => t.poi_id === poi.id);
              return (
                <div
                  key={i}
                  className={`map-search-item ${hasData ? 'has-data' : ''}`}
                  onClick={() => handleSearchResultClick(poi)}
                >
                  <span>{hasData ? '✅' : '📍'}</span>
                  <span>{poi.name}</span>
                  <span className="map-search-addr">{poi.address}</span>
                </div>
              );
            })}
            <button className="map-search-clear" onClick={() => setSearchResults([])}>关闭</button>
          </div>
        )}
      </div>

      {data.length === 0 && merchants.length === 0 ? (
        <div className="map-empty">
          <div className="map-empty-icon">🗺️</div>
          <h3>暂无消费标记</h3>
          <p>记一笔时添加位置信息，消费点就会出现在地图上</p>
        </div>
      ) : (
        <APILoader akey={amapKey} version="2.0" plugins={['AMap.PlaceSearch', 'AMap.HeatMap', 'AMap.Geolocation']}>
          <AnyMap
            ref={mapRef}
            center={center}
            zoom={13}
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
          >
            {/* 标记视图 */}
            {viewMode === 'marker' &&
              data.map((transaction) => {
                const pos: [number, number] = [transaction.longitude, transaction.latitude];
                return (
                  <AnyMarker
                    key={transaction.id}
                    position={pos}
                    content={createMarkerContent(transaction.category, Number(transaction.amount), maxAmount)}
                    onClick={() => handleMarkerClick(transaction, pos)}
                  />
                );
              })}

            {/* 商户地图视图 */}
            {viewMode === 'merchant-map' &&
              merchants.map((m, idx) => {
                const tx = data.find((t) => t.location_name === m.location_name);
                const pos: [number, number] = tx
                  ? [tx.longitude, tx.latitude]
                  : [116.397428 + (idx % 10) * 0.01, 39.90923 + Math.floor(idx / 10) * 0.01];
                return (
                  <AnyMarker
                    key={idx}
                    position={pos}
                    content={createMerchantContent(m.total_amount, maxAmount)}
                    onClick={() => handleMerchantClick(m, idx)}
                  />
                );
              })}

            {/* InfoWindow */}
            {activeItem && infoPos && (
              <AnyInfoWindow
                position={infoPos}
                visible={true}
                onClose={handleInfoClose}
                offset={[0, -20]}
              >
                {activeType === 'transaction' ? (
                  <div className="marker-info-window">
                    <div className="marker-info-header">
                      <span className="marker-info-icon">
                        {getCategoryIcon((activeItem as MapTransaction).category)}
                      </span>
                      <span className="marker-info-category">
                        {getCategoryName((activeItem as MapTransaction).category)}
                      </span>
                    </div>
                    <div className="marker-info-amount">
                      {formatAmountWithType(
                        (activeItem as MapTransaction).amount,
                        (activeItem as MapTransaction).type === 'income'
                      )}
                    </div>
                    <div className="marker-info-location">
                      📍 {(activeItem as MapTransaction).location_name}
                    </div>
                    {(activeItem as MapTransaction).description && (
                      <div className="marker-info-note">
                        💬 {(activeItem as MapTransaction).description}
                      </div>
                    )}
                    <div className="marker-info-date">
                      {(activeItem as MapTransaction).date}
                    </div>
                  </div>
                ) : (
                  <div className="marker-info-window">
                    <div className="marker-info-header">
                      <span className="marker-info-icon">🏪</span>
                      <span className="marker-info-category">
                        {(activeItem as MerchantSummary).location_name}
                      </span>
                    </div>
                    <div className="marker-info-amount" style={{ color: '#EE6666' }}>
                      -¥ {(activeItem as MerchantSummary).total_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="marker-info-location">
                      📊 {(activeItem as MerchantSummary).transaction_count} 次消费
                    </div>
                    <div className="marker-info-date">
                      最近: {(activeItem as MerchantSummary).last_transaction_date}
                    </div>
                  </div>
                )}
              </AnyInfoWindow>
            )}
          </AnyMap>
        </APILoader>
      )}
    </div>
  );
};
