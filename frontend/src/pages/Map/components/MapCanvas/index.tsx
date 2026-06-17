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

  // ---- Map instance via pool ----
  const { mapContainerRef, map, ready } = useMapInstance('map-canvas', {
    skipResizeObserver: true,
  });

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
      dataFittedRef.current = true;
      return;
    }

    setLocateError('');
    dataFittedRef.current = true;

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
