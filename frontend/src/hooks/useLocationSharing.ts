import { useState, useEffect, useRef, useCallback } from 'react';
import { updateMyLocation } from '../services/mapApi';

/** API 基础地址，与 services/api.ts 保持一致 */
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

/** 位置上报间隔（毫秒） */
const REPORT_INTERVAL_MS = 30_000;

/** 触发上报的最小位移距离（米） */
const MIN_DISTANCE_M = 50;

/**
 * 使用 Haversine 公式计算两点之间的球面距离（单位：米）
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000; // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 将 GeolocationPositionError 转为用户可读的错误消息
 */
function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return '位置权限被拒绝，请在浏览器设置中允许位置访问';
    case error.POSITION_UNAVAILABLE:
      return '无法获取位置信息，请检查设备定位服务';
    case error.TIMEOUT:
      return '获取位置超时，请重试';
    default:
      return '获取位置失败';
  }
}

/**
 * 位置坐标快照
 */
interface PositionSnapshot {
  latitude: number;
  longitude: number;
}

/**
 * useLocationSharing — 管理浏览器地理位置共享与定时上报。
 *
 * 当 `enabled` 为 true 且 `bookId` 有效时：
 * - 使用 navigator.geolocation.watchPosition 持续获取位置
 * - 位置变化超过 50m 时立即上报
 * - 每 30s 定时上报最新位置
 * - 组件卸载 / 关闭标签页时自动发送 isSharing=false
 *
 * @param bookId - 当前账本 ID（null/undefined 时不启动）
 * @param enabled - 外部传入的是否启用（通常来自开关状态）
 */
export function useLocationSharing(
  bookId: string | undefined,
): {
  isSharing: boolean;
  setIsSharing: (v: boolean) => void;
  locationError: string | null;
} {
  const [isSharing, setIsSharing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Refs — 在回调闭包中保持最新值
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<PositionSnapshot | null>(null);
  const lastSentRef = useRef<PositionSnapshot | null>(null);
  const isSharingRef = useRef(false);
  const sendingRef = useRef(false);  // 防并发上报

  // 保持 isSharingRef 同步
  useEffect(() => {
    isSharingRef.current = isSharing;
  }, [isSharing]);

  /** 上报位置到后端，静默失败 */
  const sendLocation = useCallback(
    async (lat: number, lng: number, sharing: boolean): Promise<void> => {
      if (sendingRef.current) return;  // 防并发
      sendingRef.current = true;
      try {
        await updateMyLocation({ latitude: lat, longitude: lng, isSharing: sharing });
        lastSentRef.current = { latitude: lat, longitude: lng };
      } catch {
        // 位置上报失败不应打断用户体验，静默忽略
      } finally {
        sendingRef.current = false;
      }
    },
    [],
  );

  // ---- 主 effect：启动 / 停止位置共享 ----
  useEffect(() => {
    // 不满足启动条件：清理并退出
    if (!bookId || !isSharing) {
      cleanUp();
      return;
    }

    // 检查浏览器支持
    if (!navigator.geolocation) {
      setLocationError('浏览器不支持地理位置功能');
      setIsSharing(false);
      return;
    }

    setLocationError(null);
    lastSentRef.current = null;
    lastPositionRef.current = null;

    // 启动位置监听
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        lastPositionRef.current = { latitude, longitude };
        setLocationError(null);

        const lastSent = lastSentRef.current;

        if (lastSent) {
          const dist = haversineDistance(
            lastSent.latitude,
            lastSent.longitude,
            latitude,
            longitude,
          );
          // 位移超过阈值时立即上报
          if (dist > MIN_DISTANCE_M) {
            sendLocation(latitude, longitude, true);
          }
        } else {
          // 首次获取位置，立即上报
          sendLocation(latitude, longitude, true);
        }
      },
      (error: GeolocationPositionError) => {
        setLocationError(geolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 30_000,
        maximumAge: 10_000,
      },
    );

    // 30s 定时上报（无论位移是否超过阈值）
    intervalRef.current = setInterval(() => {
      const current = lastPositionRef.current;
      if (current && isSharingRef.current) {
        sendLocation(current.latitude, current.longitude, true);
      }
    }, REPORT_INTERVAL_MS);

    return () => {
      // 组件卸载时发送关闭共享请求
      if (isSharingRef.current && lastSentRef.current) {
        updateMyLocation({
          latitude: lastSentRef.current.latitude,
          longitude: lastSentRef.current.longitude,
          isSharing: false,
        }).catch(() => {});
      }
      cleanUp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, isSharing, sendLocation]);

  /** 清理 geolocation watch + 定时器 */
  function cleanUp(): void {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastPositionRef.current = null;
    // 不清理 lastSentRef，toggle effect 需要用它发送 isSharing=false
  }

  // ---- beforeunload：页面/标签页关闭时发送关闭共享 ----
  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (!isSharingRef.current || !lastPositionRef.current) return;

      const body = JSON.stringify({
        latitude: lastPositionRef.current.latitude,
        longitude: lastPositionRef.current.longitude,
        isSharing: false,
      });

      // 优先使用 sendBeacon（fire-and-forget）
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(`${API_BASE}/map/location`, blob);
      } else {
        // 回退到 fetch + keepalive
        const token = localStorage.getItem('auth_token');
        const currentBookId = localStorage.getItem('current_book_id');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (currentBookId) headers['x-book-id'] = currentBookId;

        fetch(`${API_BASE}/map/location`, {
          method: 'POST',
          headers,
          body,
          keepalive: true,
        }).catch(() => {
          // fire-and-forget，忽略错误
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { isSharing, setIsSharing, locationError };
}
