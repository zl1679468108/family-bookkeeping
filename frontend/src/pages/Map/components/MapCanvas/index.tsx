import React, { useMemo, useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { MapTransaction, MerchantSummary, MapMember } from '../../../../types/map';
import { TransactionHistoryModal } from '../TransactionHistoryModal';
import { useMapInstance } from '../../../../hooks/useMapInstance';
import { AmapManager } from '../../../../services/amapManager';
import './index.scss';

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

/**
 * 创建足迹 Marker 的 HTML 内容。
 */
function createFootprintContent(
  merchant: MerchantSummary,
  userId?: string,
  colorMap?: Map<string, string>,
  members?: MapMember[],
): string {
  const size = 36;
  if (userId && colorMap && colorMap.has(userId)) {
    const memberColor = colorMap.get(userId)!;
    const member = members?.find((m) => m.userId === userId);
    const initial = member ? member.username.charAt(0).toUpperCase() : '?';
    return `
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%; background: ${memberColor};
        border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px; font-weight: 700; white-space: nowrap;
      ">${initial}</div>
    `;
  }
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

/* ------------------------------------------------------------------ */
/*  InfoWindow content builder                                         */
/* ------------------------------------------------------------------ */

function buildMemberBreakdownHtml(
  breakdown: MerchantSummary['memberBreakdown'],
  colorMap?: Map<string, string>,
): string {
  if (!breakdown || breakdown.length === 0) return '';
  const totalExpense = breakdown.reduce((sum, b) => sum + b.expenseTotal, 0) || 1;
  const rows = breakdown
    .map((b) => {
      const pct = Math.round((b.expenseTotal / totalExpense) * 100);
      const memberColor = colorMap?.get(b.userId) ?? '#999';
      return `
        <div class="member-breakdown-row">
          <span class="member-breakdown-color-bar" style="background:${memberColor}"></span>
          <span class="member-breakdown-name">${b.username}</span>
          <span class="member-breakdown-amount">
            ¥ ${b.expenseTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </span>
          <span class="member-breakdown-pct">(${pct}%)</span>
          <div class="member-breakdown-bar-track">
            <div class="member-breakdown-bar-fill" style="width:${pct}%;background:${memberColor}"></div>
          </div>
        </div>
      `;
    })
    .join('');
  return `<div class="member-breakdown-section"><div class="member-breakdown-divider"></div>${rows}</div>`;
}

function buildInfoWindowHtml(
  merchant: MerchantSummary,
  colorMap?: Map<string, string>,
): string {
  const expenseHtml = merchant.expense_count > 0
    ? `
      <div class="footprint-info-row expense clickable" data-action="show-history">
        <span class="footprint-info-label">支出</span>
        <span class="footprint-info-amount expense">
          ¥ ${merchant.expense_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
        <span class="footprint-info-count">${merchant.expense_count} 次</span>
      </div>`
    : '';
  const incomeHtml = merchant.income_count > 0
    ? `
      <div class="footprint-info-row income clickable" data-action="show-history">
        <span class="footprint-info-label">收入</span>
        <span class="footprint-info-amount income">
          ¥ ${merchant.income_total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
        </span>
        <span class="footprint-info-count">${merchant.income_count} 次</span>
      </div>`
    : '';
  return `
    <div class="marker-info-window footprint-info">
      <div class="marker-info-header">
        <span class="marker-info-icon">🏪</span>
        <span class="marker-info-category">${merchant.location_name}</span>
      </div>
      ${expenseHtml}
      ${incomeHtml}
      ${buildMemberBreakdownHtml(merchant.memberBreakdown, colorMap)}
      <div class="marker-info-date">最近交易: ${merchant.last_transaction_date}</div>
    </div>
  `;
}

function buildInfoWindowElement(
  merchant: MerchantSummary,
  colorMap: Map<string, string> | undefined,
  onShowHistory: () => void,
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildInfoWindowHtml(merchant, colorMap);
  wrapper.querySelectorAll('[data-action="show-history"]').forEach((el) => {
    el.addEventListener('click', onShowHistory);
  });
  return wrapper;
}

/* ------------------------------------------------------------------ */
/*  Exposed handle                                                     */
/* ------------------------------------------------------------------ */

export interface MapCanvasHandle {
  getMap: () => any;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface MapCanvasProps {
  data: MapTransaction[];
  merchants: MerchantSummary[];
  viewMode: 'footprints' | 'heatmap';
  members?: MapMember[];
  colorMap?: Map<string, string>;
  selectedMemberId?: string | null;
  onMapReady?: (map: any) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const _MapCanvas: React.ForwardRefRenderFunction<MapCanvasHandle, MapCanvasProps> = (
  { data, merchants, viewMode, members = [], colorMap, selectedMemberId = null, onMapReady },
  ref,
) => {
  const [activeInfo, setActiveInfo] = useState<{ merchant: MerchantSummary; pos: [number, number] } | null>(null);
  const [historyMerchant, setHistoryMerchant] = useState<MerchantSummary | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [locateError, setLocateError] = useState('');

  // ---- Map instance via pool ----
  const { mapContainerRef, map, ready } = useMapInstance('map-canvas', {
    skipResizeObserver: true,
  });

  const mapRef = useRef<any>(null);
  mapRef.current = map;

  const locateDone = useRef(false);
  const dataFittedRef = useRef(false);

  // ---- Imperative InfoWindow ----
  const infoWindowRef = useRef<any>(null);

  // ---- Expose map instance ----
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current ?? null,
  }));

  // ---- onMapReady callback ----
  const mapReadyNotified = useRef(false);
  useEffect(() => {
    if (!onMapReady) return;
    if (ready && map && !mapReadyNotified.current) {
      mapReadyNotified.current = true;
      onMapReady(map);
    }
  }, [ready, map, onMapReady]);

  // 多成员且已选择成员时启用成员着色
  const useMemberColor = (colorMap?.size ?? 0) >= 2 && selectedMemberId !== null;

  // 筛选/视图切换时关闭已打开的信息窗
  useEffect(() => {
    setActiveInfo(null);
  }, [viewMode, data, merchants]);

  /* ---- allPoints 计算 ---- */
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

  /* ====== fit：resize 只在尺寸变化时调用，setBounds 在数据变化时调用 ====== */
  const lastFitPointsRef = useRef<string>('');
  const lastSizeRef = useRef({ w: 0, h: 0 });
  useEffect(() => {
    const AMap = AmapManager.getInstance().AMap;
    if (!map || !AMap?.LngLat || allPoints.length === 0) return;

    const pointsKey = allPoints.map(p => p[0].toFixed(5) + ',' + p[1].toFixed(5)).sort().join(';');
    if (lastFitPointsRef.current === pointsKey) return;

    const el = (map as any).getContainer?.() ?? (map as any)._container;
    const w = el ? (el.clientWidth || 0) : 0;
    const h = el ? (el.clientHeight || 0) : 0;
    const sizeChanged = w > 0 && h > 0 && (w !== lastSizeRef.current.w || h !== lastSizeRef.current.h);
    lastSizeRef.current = { w, h };
    lastFitPointsRef.current = pointsKey;

    // Only resize when container size actually changed (coming from pool)
    // Otherwise resize would clear content markers already placed on the map
    if (sizeChanged && typeof map.resize === 'function') map.resize();

    setLocateError('');
    dataFittedRef.current = true;

    if (allPoints.length >= 2) {
      const lngs = allPoints.map(p => p[0]);
      const lats = allPoints.map(p => p[1]);
      const sw = new AMap.LngLat(Math.min(...lngs), Math.min(...lats));
      const ne = new AMap.LngLat(Math.max(...lngs), Math.max(...lats));
      map.setBounds(new AMap.Bounds(sw, ne), false, [60, 40, 80, 40]);
    } else {
      map.setCenter(allPoints[0]);
      map.setZoom(15);
    }
  }, [allPoints, map]);

  /* ====== 超时无数据 → 定位当前位置 ====== */
  useEffect(() => {
    if (!map) return;

    const timer = setTimeout(() => {
      if (dataFittedRef.current || locateDone.current) return;
      const AMap = AmapManager.getInstance().AMap;
      if (!AMap?.Geolocation) {
        setLocateError('定位功能不可用');
        locateDone.current = true;
        return;
      }
      const geo = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
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
  }, [map]);

  /* ====== 热力图 ====== */
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    const AMap = AmapManager.getInstance().AMap;

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (viewMode !== 'heatmap' || data.length === 0 || !AMap?.HeatMap) return;

    const heatmapData = data.map((t) => ({
      lng: t.longitude,
      lat: t.latitude,
      count: Math.max(1, Math.floor(Number(t.amount) / 10)),
    }));
    const heatmap = new AMap.HeatMap(map, {
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
  }, [viewMode, data, map]);

  /* ====== Footprint markers — 每次数据变化全量重建，确保筛选条件生效 ====== */
  useEffect(() => {
    if (!map || !ready || viewMode !== 'footprints') {
      if (map) {
        const old = (map as any).__amapMarkers as any[] | undefined;
        if (old) {
          old.forEach((m) => { if (m?.setMap) m.setMap(null); });
          delete (map as any).__amapMarkers;
        }
      }
      return;
    }

    const AMap = AmapManager.getInstance().AMap;
    if (!AMap) return;

    // 清除旧标记
    const old = (map as any).__amapMarkers as any[] | undefined;
    if (old) {
      old.forEach((m) => { if (m?.setMap) m.setMap(null); });
    }

    // 全量重建（merchants/data 变化已经由 effect deps 精确控制触发时机）
    const newMarkers: any[] = [];
    merchants.forEach((merchant) => {
      const tx = data.find((t) => t.location_name === merchant.location_name);
      if (!tx) return;

      const txUserId = useMemberColor ? tx.userId : undefined;
      const content = createFootprintContent(merchant, txUserId, colorMap, members);

      const marker = new AMap.Marker({
        position: [tx.longitude, tx.latitude],
        content,
        map,
        offset: new AMap.Pixel(-18, -18),
      });

      marker.on('click', () => handleMerchantClick(merchant));
      newMarkers.push(marker);
    });

    (map as any).__amapMarkers = newMarkers;
  }, [map, ready, viewMode, merchants, data, useMemberColor, colorMap, members]);

  /* ====== InfoWindow (imperative) ====== */

  useEffect(() => {
    if (!map) return;
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap) return;

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      return;
    }

    infoWindowRef.current = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -25),
    });

    const closeHandler = () => setActiveInfo(null);
    infoWindowRef.current.on('close', closeHandler);

    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current.off('close', closeHandler);
        infoWindowRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    const iw = infoWindowRef.current;
    if (!iw || !map) return;

    if (activeInfo) {
      const contentEl = buildInfoWindowElement(
        activeInfo.merchant,
        colorMap,
        () => handleShowHistory(activeInfo.merchant),
      );
      iw.setContent(contentEl);
      iw.open(map, activeInfo.pos);
    } else {
      iw.close();
    }
  }, [activeInfo, map, colorMap]);

  /* ====== Handlers ====== */

  const dataRef = useRef(data);
  dataRef.current = data;

  const handleMerchantClick = useCallback(
    (merchant: MerchantSummary) => {
      const tx = dataRef.current.find((t) => t.location_name === merchant.location_name);
      if (tx) {
        setActiveInfo({ merchant, pos: [tx.longitude, tx.latitude] });
      }
    },
    [],
  );

  const handleShowHistory = useCallback((merchant: MerchantSummary) => {
    setActiveInfo(null);
    setHistoryMerchant(merchant);
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap?.PlaceSearch) return;
    setSearching(true);
    const placeSearch = new AMap.PlaceSearch({ pageSize: 20, pageIndex: 1, city: '全国' });
    placeSearch.search(searchText, (status: string, result: any) => {
      setSearching(false);
      if (status === 'complete' && result.poiList?.pois) {
        setSearchResults(result.poiList.pois);
      }
    });
  }, [searchText]);

  const handleSearchResultClick = useCallback((poi: any) => {
    if (mapRef.current) {
      mapRef.current.setCenter([poi.location.lng, poi.location.lat]);
      mapRef.current.setZoom(15);
    }
  }, []);

  /* ====== Render ====== */

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

        {/* Map container — managed by useMapInstance via callback ref */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      </div>

      {historyMerchant && (
        <TransactionHistoryModal merchant={historyMerchant} onClose={() => setHistoryMerchant(null)} />
      )}
    </>
  );
};

export const MapCanvas = forwardRef(_MapCanvas);
