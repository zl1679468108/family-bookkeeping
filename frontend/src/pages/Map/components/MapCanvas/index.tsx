import React, { useMemo, useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { MapTransaction, MerchantSummary, MapMember } from '@family-bookkeeping/shared-types'
import { TransactionHistoryModal } from '../TransactionHistoryModal';
import { useMapInstance } from '../../../../hooks/useMapInstance';
import { AmapManager } from '../../../../services/amapManager';
import './index.scss';
import { getThemeColors } from '../../../../utils/themeColors'

/* ⚠️ 静态初值，永不随 state 变化，避免二次变更视口取消瓦片 */
function parseHexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  if (h.length >= 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [170, 170, 170];
}

function getMerchantColor(expenseTotal: number, incomeTotal: number): string {
  const theme = getThemeColors();
  const total = expenseTotal + incomeTotal;
  if (total === 0) return theme.fg3;
  const expenseRatio = expenseTotal / total;
  if (expenseRatio >= 0.9) return theme.exp;
  if (expenseRatio <= 0.1) return theme.inc;
  const [er, eg, eb] = parseHexRgb(theme.exp);
  const [ir, ig, ib] = parseHexRgb(theme.inc);
  const t = 1 - expenseRatio; // 越偏收入越靠近 inc
  const r = Math.round(er + (ir - er) * t);
  const g = Math.round(eg + (ig - eg) * t);
  const b = Math.round(eb + (ib - eb) * t);
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
  const theme = getThemeColors();
  const ring = theme.srf;
  const onColor = 'var(--on-pr)';
  if (userId && colorMap && colorMap.has(userId)) {
    const memberColor = colorMap.get(userId)!;
    const member = members?.find((m) => m.userId === userId);
    const initial = member ? member.username.charAt(0).toUpperCase() : '?';
    return `
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%; background: ${memberColor};
        border: 3px solid ${ring}; box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: ${onColor}; font-size: 16px; font-weight: 700; white-space: nowrap;
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
      border: 3px solid ${ring}; box-shadow: 0 2px 10px rgba(0,0,0,0.35);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: ${onColor}; font-size: 12px; font-weight: 700; white-space: nowrap;
    ">${shortName}</div>
  `;
}

/* ------------------------------------------------------------------ */
/*  Exposed handle                                                     */
/* ------------------------------------------------------------------ */

export interface MapCanvasHandle {
  getMap: () => any;
  /** 平移地图到指定坐标 */
  setCenter: (longitude: number, latitude: number) => void;
  /** 根据一组坐标调整地图视野 */
  setBounds: (points: [number, number][]) => void;
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
  /** 父组件（工具条）正在处理 POI 搜索——隐藏自身的浮动搜索浮层 */
  hasExternalSearch?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const _MapCanvas: React.ForwardRefRenderFunction<MapCanvasHandle, MapCanvasProps> = (
  { data, merchants, viewMode, members = [], colorMap, selectedMemberId = null, onMapReady },
  ref,
) => {
  const [, setActiveInfo] = useState<{ merchant: MerchantSummary; pos: [number, number] } | null>(null);
  const [historyMerchant, setHistoryMerchant] = useState<MerchantSummary | null>(null);
  const [locateError, setLocateError] = useState('');
  const [mapVisible, setMapVisible] = useState(false);

  // ---- Map instance via pool ----
  const { mapContainerRef, map: rawMap, ready, error: mapError } = useMapInstance('map-canvas', {
    // 开启 ResizeObserver：容器尺寸变化（侧栏折叠/窗口变化）时补 resize，避免空白瓦片
    skipResizeObserver: false,
  });
  const map = rawMap as any;

  const mapRef = useRef<any>(null);
  mapRef.current = map;

  const locateDone = useRef(false);
  const dataFittedRef = useRef(false);

  // ---- Imperative InfoWindow & Heatmap ref (统一提前声明，供后面的清理回调使用) ----
  const infoWindowRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);

  // ---- Expose map instance ----
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current ?? null,
    setCenter: (longitude: number, latitude: number) => {
      const m = mapRef.current;
      const AMap = AmapManager.getInstance().AMap;
      if (!m || !AMap?.LngLat) return;
      try {
        m.setCenter(new AMap.LngLat(longitude, latitude));
        m.setZoom && m.setZoom(Math.max(m.getZoom?.() || 15, 15));
      } catch {}
    },
    setBounds: (points: [number, number][]) => {
      const m = mapRef.current;
      const AMap = AmapManager.getInstance().AMap;
      if (!m || !AMap?.LngLat || !points || points.length === 0) return;
      try {
        if (points.length >= 2) {
          const lngs = points.map((p) => p[0]);
          const lats = points.map((p) => p[1]);
          const sw = new AMap.LngLat(Math.min(...lngs), Math.min(...lats));
          const ne = new AMap.LngLat(Math.max(...lngs), Math.max(...lats));
          m.setBounds(new AMap.Bounds(sw, ne), false, [80, 60, 80, 60]);
        } else {
          m.setCenter(new AMap.LngLat(points[0][0], points[0][1]));
          m.setZoom(15);
        }
      } catch {}
    },
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

  // 地图 ready 后立即显示并多次 resize（不再等定位/拟合，避免空白遮罩）
  useEffect(() => {
    if (!ready || !map) return;
    setMapVisible(true);
    const doResize = () => {
      try {
        const el = (map as any).getContainer?.() ?? (map as any)._container;
        const parent = el?.parentElement as HTMLElement | null;
        if (parent) {
          const h = parent.clientHeight || parent.offsetHeight || 480;
          const w = parent.clientWidth || parent.offsetWidth || parent.offsetWidth;
          if (el && h > 0) {
            el.style.width = '100%';
            el.style.height = `${h}px`;
          }
          if (w > 0 && parent.style) {
            // keep parent from collapsing
            if (!parent.style.minHeight) parent.style.minHeight = '480px';
          }
        }
        if (typeof map.resize === 'function') map.resize();
      } catch { /* ignore */ }
    };
    doResize();
    const t1 = window.setTimeout(doResize, 50);
    const t2 = window.setTimeout(doResize, 200);
    const t3 = window.setTimeout(doResize, 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [ready, map]);

  // 多成员且已选择成员时启用成员着色
  const useMemberColor = (colorMap?.size ?? 0) >= 2 && selectedMemberId !== null;

  // ---- Handlers（提前定义，供 markers/infoWindow 使用，保证依赖稳定） ----
  const dataRef = useRef(data);
  dataRef.current = data;

  const handleMerchantClick = useCallback(
    (merchant: MerchantSummary) => {
      const tx = dataRef.current.find((t) => t.location_name === merchant.location_name);
      if (!tx) return;
      // 直接打开交易历史弹窗，不再显示信息窗口
      setHistoryMerchant(merchant);
      // 点击点位后，地图平滑移动到该点位，保证其在视口中央
      if (map && typeof map.panTo === 'function') {
        map.panTo([tx.longitude, tx.latitude]);
      }
    },
    [map],
  );

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

  /* ====== 统一清理工具 ====== */
  const clearMarkers = useCallback((mapInstance: any) => {
    if (!mapInstance) return;
    const oldMarkers = (mapInstance as any).__amapMarkers as any[] | undefined;
    if (oldMarkers) {
      oldMarkers.forEach((m) => { if (m?.setMap) m.setMap(null); });
      delete (mapInstance as any).__amapMarkers;
    }
  }, []);

  const clearHeatmap = useCallback(() => {
    if (heatmapRef.current) {
      try { heatmapRef.current.setMap(null); } catch {}
      heatmapRef.current = null;
    }
  }, []);

  /* ====== 视图切换时，清理对方模式的覆盖物 + infoWindow ====== */
  useEffect(() => {
    if (!map) return;
    if (viewMode === 'heatmap') {
      clearMarkers(map);
    } else if (viewMode === 'footprints') {
      clearHeatmap();
    }
    if (infoWindowRef.current) {
      try { infoWindowRef.current.close(); } catch {}
    }
    setActiveInfo(null);
  }, [viewMode, map, clearMarkers, clearHeatmap]);

  /* ====== fit-bounds：数据或视图变化时，将所有点位融入视口 ====== */
  const lastFitGenRef = useRef<string>('');
  const lastSizeRef = useRef({ w: 0, h: 0 });
  useEffect(() => {
    const AMap = AmapManager.getInstance().AMap;
    if (!map || !AMap?.LngLat) return;

    // generation = viewMode + 前 50 个点坐标字符串（避免"同长度不同坐标"被误判为缓存命中）
    const sample = allPoints.slice(0, 50).map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join('|');
    const generation = `${viewMode}|${allPoints.length}|${merchants.length}|${data.length}|${sample}`;

    const el = (map as any).getContainer?.() ?? (map as any)._container;
    const w = el ? (el.clientWidth || 0) : 0;
    const h = el ? (el.clientHeight || 0) : 0;
    const sizeChanged = w !== lastSizeRef.current.w || h !== lastSizeRef.current.h;
    lastSizeRef.current = { w, h };

    if ((w === 0 || h === 0) && typeof map.resize === 'function') {
      map.resize();
    }

    // generation 未变化且已有数据，不重复执行（空数据不做缓存跳过）
    if (lastFitGenRef.current === generation && allPoints.length > 0) return;
    lastFitGenRef.current = generation;

    if (allPoints.length === 0) {
      setLocateError('');
      // ⚠️ 不设置 dataFittedRef.current = true
      // 空数据时没有"已拟合"的视口，应让下面的兜底定位（AMap.Geolocation）正常触发，
      // 用浏览器原生高精度定位获取用户当前位置，而不是停在 AMap 默认的 IP 定位结果上。
      return;
    }

    setLocateError('');
    dataFittedRef.current = true;
    // 数据已就绪并拟合视口，立即显示地图（不再等定位）
    setMapVisible(true);

    // 确保 map 容器尺寸已就绪后再定位
    if (sizeChanged || w === 0 || h === 0) {
      if (typeof map.resize === 'function') map.resize();
    }

    if (allPoints.length >= 2) {
      const lngs = allPoints.map(p => p[0]);
      const lats = allPoints.map(p => p[1]);
      const sw = new AMap.LngLat(Math.min(...lngs), Math.min(...lats));
      const ne = new AMap.LngLat(Math.max(...lngs), Math.max(...lats));
      // 延迟一帧执行 setBounds，确保瓦片加载完成
      setTimeout(() => {
        try {
          map.setBounds(new AMap.Bounds(sw, ne), false, [120, 80, 120, 80]);
        } catch {}
      }, 0);
    } else {
      setTimeout(() => {
        try {
          map.setCenter(allPoints[0]);
          map.setZoom(15);
        } catch {}
      }, 0);
    }
  }, [allPoints, map, viewMode, merchants.length, data.length]);

  /* ====== 立即定位当前位置（无数据时直接显示用户所在城市，不闪现 IP 定位） ====== */
  useEffect(() => {
    if (!map) return;

    // 数据已加载，无需定位兜底
    if (dataFittedRef.current) {
      setMapVisible(true);
      return;
    }

    const AMap = AmapManager.getInstance().AMap;
    if (!AMap?.Geolocation) {
      setLocateError('定位功能不可用');
      setMapVisible(true);
      locateDone.current = true;
      return;
    }

    const geo = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 8000 });
    geo.getCurrentPosition((status: string, result: any) => {
      locateDone.current = true;
      // 定位返回前，如果数据已经加载并被拟合到视口，则不再用定位结果覆盖
      if (dataFittedRef.current) {
        setMapVisible(true);
        return;
      }
      if (status === 'complete' && result.position) {
        map.setCenter([result.position.lng, result.position.lat]);
        map.setZoom(12);
      } else {
        setLocateError('无法获取当前位置，请确认已授权位置权限');
      }
      setMapVisible(true);
    });

    // 超时兜底：定位 SDK 异常未回调时，3s 后强制显示地图
    const fallback = setTimeout(() => {
      if (!locateDone.current) {
        setMapVisible(true);
      }
    }, 3000);
    return () => clearTimeout(fallback);
  }, [map]);

  /* ====== 热力图 — 只管理自己的图层，切换筛选时先清后建 ====== */
  useEffect(() => {
    if (!map) return;
    const AMap = AmapManager.getInstance().AMap;

    // 先清自己上一次的 heatmap（切换筛选条件或 data 变化时重建）
    clearHeatmap();

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
        try { heatmapRef.current.setMap(null); } catch {}
        heatmapRef.current = null;
      }
    };
  }, [viewMode, data, map, clearHeatmap, clearMarkers]);

  /* ====== Footprint markers — 只管理自己的图层，切换筛选时先清后建 ====== */
  useEffect(() => {
    if (!map || !ready) return;

    // 先清自己上一次的 markers（切换筛选条件或 data 变化时重建）
    clearMarkers(map);

    if (viewMode !== 'footprints') return;

    const AMap = AmapManager.getInstance().AMap;
    if (!AMap) return;

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

    return () => {
      // 组件卸载或依赖变化时，清除 markers
      clearMarkers(map);
    };
  }, [map, ready, viewMode, merchants, data, useMemberColor, colorMap, members, clearMarkers, handleMerchantClick]);

  /* ====== InfoWindow (imperative)：每次 map 变化时重建，避免绑定到已失效的 map ====== */

  useEffect(() => {
    if (!map) return;
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap) return;

    // map 变化时：先销毁旧 infoWindow，避免绑定到已失效的 map
    if (infoWindowRef.current) {
      try { infoWindowRef.current.close(); } catch {}
      infoWindowRef.current = null;
    }

    const infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -25),
    });

    const closeHandler = () => setActiveInfo(null);
    infoWindow.on('close', closeHandler);
    infoWindowRef.current = infoWindow;

    return () => {
      try { infoWindow.close(); } catch {}
      infoWindowRef.current = null;
    };
  }, [map]);



  /* ====== Render ====== */

  return (
    <>
      <div className="map-canvas-wrapper">
        {mapError && (
          <div className="map-error-fallback">
            <div className="map-error-icon">🗺️</div>
            <div className="map-error-title">地图功能暂不可用</div>
            <div className="map-error-desc">地图服务需要网络环境，请检查网络连接后刷新页面</div>
          </div>
        )}

        {locateError && !mapError && <div className="map-locate-error">{locateError}</div>}

        {/* 定位中遮罩：定位完成前隐藏地图，避免 AMap 默认 IP 定位（吉安）闪现 */}
        {!mapVisible && !locateError && !mapError && (
          <div className="map-locating-overlay">
            <div className="map-locating-spinner" />
            <div className="map-locating-text">正在定位当前位置…</div>
          </div>
        )}

        {/* Map container — managed by useMapInstance via callback ref */}
        {!mapError && (
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: 480,
              opacity: mapVisible ? 1 : 0,
              transition: 'opacity 0.25s ease',
              background: 'var(--bg)',
            }}
          />
        )}
      </div>

      {historyMerchant && (
        <TransactionHistoryModal merchant={historyMerchant} onClose={() => setHistoryMerchant(null)} />
      )}
    </>
  );
};

export const MapCanvas = forwardRef(_MapCanvas);
