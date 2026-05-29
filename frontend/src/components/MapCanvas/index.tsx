import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { APILoader, Map, Marker, InfoWindow } from '@uiw/react-amap';
import type { MapTransaction, MerchantSummary } from '../../types/map';
import { TransactionHistoryModal } from '../TransactionHistoryModal';
import './index.scss';

const AnyMap = Map as any;
const AnyMarker = Marker as any;
const AnyInfoWindow = InfoWindow as any;

const scode = process.env.REACT_APP_AMAP_SECRET;
if (scode && typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = { securityJsCode: scode };
}

/* ⚠️ 静态初值，永不随 state 变化，避免二次变更视口取消瓦片 */
function getMerchantColor(expenseTotal: number, incomeTotal: number): string {
  const total = expenseTotal + incomeTotal;
  if (total === 0) return '#aaa';
  const expenseRatio = expenseTotal / total;
  if (expenseRatio >= 0.9) return '#EE6666';
  if (expenseRatio <= 0.1) return '#91CC75';
  const r = Math.round(238 - (238 - 145) * (1 - expenseRatio));
  const g = Math.round(102 + (204 - 102) * (1 - expenseRatio));
  const b = Math.round(102 - (102 - 117) * (1 - expenseRatio));
  return `rgb(${r},${g},${b})`;
}

function createFootprintContent(merchant: MerchantSummary): string {
  const size = 36;
  const color = getMerchantColor(merchant.expense_total, merchant.income_total);
  const shortName = merchant.location_name.length > 2
    ? merchant.location_name.slice(0, 2)
    : merchant.location_name;
  return `
    <div style="
      width: ${size}px; height: ${size}px;
      border-radius: 50%; background: ${color};
      border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.35);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: white; font-size: 12px; font-weight: 700; white-space: nowrap;
    ">${shortName}</div>
  `;
}

interface MapCanvasProps {
  data: MapTransaction[];
  merchants: MerchantSummary[];
  viewMode: 'footprints' | 'heatmap';
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ data, merchants, viewMode }) => {
  const [activeInfo, setActiveInfo] = useState<{ merchant: MerchantSummary; pos: [number, number] } | null>(null);
  const [historyMerchant, setHistoryMerchant] = useState<MerchantSummary | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [locateError, setLocateError] = useState('');

  const mapRef = useRef<any>(null);
  const locateDone = useRef(false);
  const fitCount = useRef(0);         // 上次 fit 的点位数，避免重复

  // 筛选/视图切换时关闭已打开的信息窗
  useEffect(() => {
    setActiveInfo(null);
  }, [viewMode, data, merchants]);

  const allPoints: [number, number][] = useMemo(() => {
    if (viewMode === 'footprints') {
      return merchants
        .map((m) => {
          const tx = data.find((t) => t.location_name === m.location_name);
          return tx ? ([tx.longitude, tx.latitude] as [number, number]) : null;
        })
        .filter((p): p is [number, number] => p !== null);
    }
    return data.map((t) => [t.longitude, t.latitude] as [number, number]);
  }, [data, merchants, viewMode]);

  /* ====== 数据到了就 fit ====== */
  useEffect(() => {
    const map = mapRef.current?.map;
    const AMapWin = (window as any).AMap;
    if (!map || !AMapWin?.LngLat || allPoints.length === 0) return;
    if (allPoints.length === fitCount.current) return;
    fitCount.current = allPoints.length;
    setLocateError('');
    if (allPoints.length >= 2) {
      // 手动计算 bounds，避免 setFitView 格式问题
      const lngs = allPoints.map(p => p[0]);
      const lats = allPoints.map(p => p[1]);
      const sw = new AMapWin.LngLat(Math.min(...lngs), Math.min(...lats));
      const ne = new AMapWin.LngLat(Math.max(...lngs), Math.max(...lats));
      const bounds = new AMapWin.Bounds(sw, ne);
      map.setBounds(bounds, false, [60, 40, 80, 40]);
    } else {
      map.setCenter(allPoints[0]);
      map.setZoom(15);
    }
  }, [allPoints]);

  /* ====== 超时无数据 → 定位当前位置 ====== */
  useEffect(() => {
    // 等地图实例到位，再加数据加载的超时
    const checkMap = setInterval(() => {
      if (mapRef.current?.map) {
        clearInterval(checkMap);
        // 给数据 3 秒时间
        const timer = setTimeout(() => {
          if (fitCount.current > 0 || locateDone.current) return;
          const map = mapRef.current?.map;
          const AMapWin = (window as any).AMap;
          if (!map || !AMapWin?.Geolocation) {
            setLocateError('定位功能不可用');
            locateDone.current = true;
            return;
          }
          const geo = new AMapWin.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
          geo.getCurrentPosition((status: string, result: any) => {
            locateDone.current = true;
            if (status === 'complete' && result.position) {
              map.setCenter([result.position.lng, result.position.lat]);
              map.setZoom(15);
            } else {
              setLocateError('无法获取当前位置，请确认已授权位置权限');
            }
          });
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, 100);
    return () => clearInterval(checkMap);
  }, []);

  /* ====== 其余逻辑 ====== */

  const heatmapRef = useRef<any>(null);

  // 热力图
  useEffect(() => {
    const map = mapRef.current?.map;
    if (!map) return;
    const AMapWin = (window as any).AMap;

    // 先清理旧图层
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (viewMode !== 'heatmap' || data.length === 0 || !AMapWin?.HeatMap) return;

    const heatmapData = data.map((t) => ({
      lng: t.longitude,
      lat: t.latitude,
      count: Math.max(1, Math.floor(Number(t.amount) / 10)),
    }));
    const heatmap = new AMapWin.HeatMap(map, {
      radius: 30,
      opacity: [0.15, 0.95],
      gradient: {
        0.2: 'rgb(0,200,0)',
        0.4: 'rgb(255,255,0)',
        0.6: 'rgb(255,140,0)',
        0.8: 'rgb(255,0,0)',
        1.0: 'rgb(150,0,0)',
      },
    });
    heatmap.setDataSet({ data: heatmapData, max: 100 });
    heatmapRef.current = heatmap;

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, [viewMode, data]);

  const dataRef = useRef(data);
  dataRef.current = data;

  const handleMerchantClick = useCallback(
    (merchant: MerchantSummary) => {
      const tx = dataRef.current.find((t) => t.location_name === merchant.location_name);
      if (tx) {
        setActiveInfo({ merchant, pos: [tx.longitude, tx.latitude] });
      }
    },
    [] // 用 dataRef 避免 data 变化导致回调重建
  );

  const handleShowHistory = useCallback((merchant: MerchantSummary) => {
    setActiveInfo(null);
    setHistoryMerchant(merchant);
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const AMapWin = (window as any).AMap;
    if (!AMapWin?.PlaceSearch) return;
    setSearching(true);
    const placeSearch = new AMapWin.PlaceSearch({ pageSize: 20, pageIndex: 1, city: '全国' });
    placeSearch.search(searchText, (status: string, result: any) => {
      setSearching(false);
      if (status === 'complete' && result.poiList?.pois) {
        setSearchResults(result.poiList.pois);
      }
    });
  }, [searchText]);

  const handleSearchResultClick = useCallback((poi: any) => {
    if (mapRef.current?.map) {
      mapRef.current.map.setCenter([poi.location.lng, poi.location.lat]);
      mapRef.current.map.setZoom(16);
    }
  }, []);

  const amapKey = process.env.REACT_APP_AMAP_KEY || '';

  return (
    <>
      <div className="map-canvas-wrapper">
        <div className="map-search-overlay">
          <input
            type="text" className="map-search-input"
            placeholder="搜索附近商户..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="map-search-btn" onClick={handleSearch} disabled={searching}>
            {searching ? '...' : '🔍'}
          </button>
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

        {locateError && <div className="map-locate-error">{locateError}</div>}

        <APILoader akey={amapKey} version="2.0" plugins={['AMap.PlaceSearch', 'AMap.HeatMap', 'AMap.Geolocation']}>
          <AnyMap
            ref={mapRef}
            style={{ width: '100%', height: '100%' }}
          >
            {viewMode === 'footprints' &&
              merchants.map((merchant, idx) => {
                const tx = data.find((t) => t.location_name === merchant.location_name);
                if (!tx) return null;
                return (
                  <AnyMarker
                    key={`fp-${idx}`}
                    position={[tx.longitude, tx.latitude]}
                    content={createFootprintContent(merchant)}
                    onClick={() => handleMerchantClick(merchant)}
                  />
                );
              })}

            <AnyInfoWindow
              position={activeInfo?.pos ?? [0, 0]}
              visible={activeInfo !== null}
              onClose={() => setActiveInfo(null)}
              offset={[0, -25]}
            >
              {activeInfo ? (
                <div className="marker-info-window footprint-info">
                  <div className="marker-info-header">
                    <span className="marker-info-icon">🏪</span>
                    <span className="marker-info-category">{activeInfo.merchant.location_name}</span>
                  </div>
                  {activeInfo.merchant.expense_count > 0 && (
                    <div className="footprint-info-row expense clickable" onClick={() => handleShowHistory(activeInfo.merchant)}>
                      <span className="footprint-info-label">支出</span>
                      <span className="footprint-info-amount expense">
                        ¥ {activeInfo.merchant.expense_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="footprint-info-count">{activeInfo.merchant.expense_count} 次</span>
                    </div>
                  )}
                  {activeInfo.merchant.income_count > 0 && (
                    <div className="footprint-info-row income clickable" onClick={() => handleShowHistory(activeInfo.merchant)}>
                      <span className="footprint-info-label">收入</span>
                      <span className="footprint-info-amount income">
                        ¥ {activeInfo.merchant.income_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="footprint-info-count">{activeInfo.merchant.income_count} 次</span>
                    </div>
                  )}
                  <div className="marker-info-date">最近交易: {activeInfo.merchant.last_transaction_date}</div>
                </div>
              ) : (
                <div />
              )}
            </AnyInfoWindow>
          </AnyMap>
        </APILoader>
      </div>

      {historyMerchant && (
        <TransactionHistoryModal merchant={historyMerchant} onClose={() => setHistoryMerchant(null)} />
      )}
    </>
  );
};
