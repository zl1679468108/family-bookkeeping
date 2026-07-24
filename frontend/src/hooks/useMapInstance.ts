/**
 * useMapInstance — React hook that acquires an AMap.Map instance from
 * the shared AmapManager pool, keeps it alive across mounts, and releases
 * it on unmount.
 *
 * Usage:
 *   const { mapContainerRef, map, ready } = useMapInstance('my-map', {
 *     zoom: 11,
 *     center: [116.397428, 39.90923],
 *   });
 *
 *   return <div ref={mapContainerRef} style={{ width:'100%', height:'100%' }} />;
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AmapManager } from '../services/amapManager';
import { ERROR_MAP_SDK_LOAD_FAILED } from '../utils/errorCopy'
import { useTheme } from '../utils/theme'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UseMapInstanceOptions {
  zoom?: number;
  center?: [number, number]; // [lng, lat]
  /** Skip the built-in ResizeObserver — component handles resize itself */
  skipResizeObserver?: boolean;
}

interface UseMapInstanceReturn {
  mapContainerRef: React.RefCallback<HTMLDivElement>;
  map: unknown | null;
  ready: boolean;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/*  Theme map styles（官方内置样式，无需自定义）                         */
/* ------------------------------------------------------------------ */

const AMAP_MAP_STYLE = {
  light: 'amap://styles/normal',
  dark: 'amap://styles/dark',
} as const

function applyMapStyle(map: any, resolved: 'light' | 'dark') {
  if (!map || typeof map.setMapStyle !== 'function') return
  try {
    map.setMapStyle(AMAP_MAP_STYLE[resolved])
  } catch {
    /* best-effort：部分环境未开通样式包时忽略 */
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useMapInstance(
  id: string,
  options?: UseMapInstanceOptions,
  active: boolean = true,
): UseMapInstanceReturn {
  const manager = useMemo(() => AmapManager.getInstance(), []);
  const { resolvedTheme } = useTheme();

  // ---- SDK readiness ----
  const [sdkReady, setSdkReady] = useState(manager.isLoaded);

  ///* ---- Parent DOM element (React-managed wrapper div) ---- */
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null);

  // ---- Map instance ----
  const [map, setMap] = useState<unknown | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acquiredRef = useRef(false);

  /* ---- Load AMap SDK once ---- */
  useEffect(() => {
    if (manager.isLoaded) {
      setSdkReady(true);
      return;
    }
    let cancelled = false;
    manager.ensureLoaded()
      .then(() => { if (!cancelled) setSdkReady(true); })
      .catch((err) => {
        if (!cancelled) {
          console.error('[useMapInstance] SDK load failed:', err)
          setError(err instanceof Error ? err.message : ERROR_MAP_SDK_LOAD_FAILED)
        }
      });
    return () => { cancelled = true; };
  }, [manager]);

  /* ---- Stabilise options ---- */
  const centerLng = options?.center?.[0];
  const centerLat = options?.center?.[1];
  const zoom = options?.zoom;
  const skipResizeObserver = options?.skipResizeObserver ?? false;
  const resolvedOptions = useMemo(
    () => ({
      skipResizeObserver,
      ...(zoom !== undefined ? { zoom } : {}),
      ...(centerLng !== undefined && centerLat !== undefined ? { center: [centerLng, centerLat] as [number, number] } : {}),
    }),
    [centerLng, centerLat, zoom, skipResizeObserver],
  );

  /* ---- Acquire / release ---- */
  useEffect(() => {
    if (!active || !sdkReady || !parentEl) return;

    let cancelled = false;
    setError(null);

    manager
      .acquire(id, parentEl, resolvedOptions)
      .then((m: any) => {
        if (cancelled) {
          manager.release(id);
          return;
        }
        setMap(m);
        setReady(true);
        acquiredRef.current = true;

        // 布局稳定后强制 resize，避免容器初始 0 尺寸导致空白瓦片
        const forceResize = () => {
          try {
            if (m && typeof m.resize === 'function') m.resize();
          } catch { /* ignore */ }
        };
        requestAnimationFrame(() => {
          forceResize();
          requestAnimationFrame(forceResize);
        });
        // 再兜底一次（字体/侧栏动画后）
        const lateTimer = window.setTimeout(forceResize, 200);
        (parentEl as any).__amapLateResizeTimer = lateTimer;

        // ResizeObserver — optional, skipped when component handles resize itself
        if (!skipResizeObserver) {
          let resizeTimer: ReturnType<typeof setTimeout> | undefined;
          const ro = new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              if (m && typeof m.resize === 'function') {
                m.resize();
              }
            }, 300);
            (parentEl as any).__amapResizeTimer = resizeTimer;
          });
          ro.observe(parentEl);
          (parentEl as any).__amapResizeObserver = ro;
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err)
          console.error('[useMapInstance] acquire failed:', err)
          setError(msg)
        }
      });

    return () => {
      cancelled = true;
      setError(null);
      if (parentEl && (parentEl as any).__amapResizeObserver) {
        (parentEl as any).__amapResizeObserver.disconnect();
        delete (parentEl as any).__amapResizeObserver;
      }
      if (parentEl && (parentEl as any).__amapResizeTimer) {
        clearTimeout((parentEl as any).__amapResizeTimer);
        delete (parentEl as any).__amapResizeTimer;
      }
      if (parentEl && (parentEl as any).__amapLateResizeTimer) {
        clearTimeout((parentEl as any).__amapLateResizeTimer);
        delete (parentEl as any).__amapLateResizeTimer;
      }
      if (acquiredRef.current) {
        manager.release(id);
        acquiredRef.current = false;
        setMap(null);
        setReady(false);
      }
    };
  }, [id, active, sdkReady, resolvedOptions, manager, parentEl, skipResizeObserver]);

  /* ---- Sync map style with app theme ---- */
  useEffect(() => {
    if (!ready || !map) return
    applyMapStyle(map, resolvedTheme)
  }, [map, ready, resolvedTheme])

  /* ---- Callback ref for the React wrapper div ---- */
  const mapContainerRef: React.RefCallback<HTMLDivElement> = useCallback(
    (el: HTMLDivElement | null) => {
      setParentEl(el);
    },
    [],
  );

  return { mapContainerRef, map, ready, error };
}

export type { UseMapInstanceOptions, UseMapInstanceReturn };
