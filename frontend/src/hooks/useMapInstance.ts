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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UseMapInstanceOptions {
  zoom?: number;
  center?: [number, number]; // [lng, lat]
  /** Skip the built-in ResizeObserver — component handles resize itself */
  skipResizeObserver?: boolean;
  [key: string]: any;
}

interface UseMapInstanceReturn {
  mapContainerRef: React.RefCallback<HTMLDivElement>;
  map: any | null;
  ready: boolean;
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

  // ---- SDK readiness ----
  const [sdkReady, setSdkReady] = useState(manager.isLoaded);

  // ---- Parent DOM element (React-managed wrapper div) ----
  const parentElRef = useRef<HTMLDivElement | null>(null);
  const parentElSetRef = useRef(false);

  // ---- Map instance ----
  const [map, setMap] = useState<any>(null);
  const [ready, setReady] = useState(false);
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
      .catch((err) => { if (!cancelled) console.error('[useMapInstance] SDK load failed:', err); });
    return () => { cancelled = true; };
  }, [manager]);

  /* ---- Stabilise options ---- */
  const resolvedOptions = useMemo(() => ({ ...options }), [options?.zoom, options?.center?.[0], options?.center?.[1]]);

  /* ---- Acquire / release ---- */
  useEffect(() => {
    if (!active || !sdkReady || !parentElRef.current) return;

    const el = parentElRef.current;
    let cancelled = false;

    manager
      .acquire(id, el, resolvedOptions)
      .then((m: any) => {
        if (cancelled) {
          manager.release(id);
          return;
        }
        setMap(m);
        setReady(true);
        acquiredRef.current = true;

        // ResizeObserver — optional, skipped when component handles resize itself
        if (!options?.skipResizeObserver) {
          let resizeTimer: ReturnType<typeof setTimeout> | undefined;
          const ro = new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
              if (m && typeof m.resize === 'function') {
                m.resize();
              }
            }, 300);
            (el as any).__amapResizeTimer = resizeTimer;
          });
          ro.observe(el);
          (el as any).__amapResizeObserver = ro;
        }
      })
      .catch((err: any) => {
        if (!cancelled) console.error('[useMapInstance] acquire failed:', err);
      });

    return () => {
      cancelled = true;
      if (el && (el as any).__amapResizeObserver) {
        (el as any).__amapResizeObserver.disconnect();
        delete (el as any).__amapResizeObserver;
      }
      if (el && (el as any).__amapResizeTimer) {
        clearTimeout((el as any).__amapResizeTimer);
        delete (el as any).__amapResizeTimer;
      }
      if (acquiredRef.current) {
        manager.release(id);
        acquiredRef.current = false;
        setMap(null);
        setReady(false);
      }
    };
  }, [id, active, sdkReady, resolvedOptions, manager]);

  /* ---- Callback ref for the React wrapper div ---- */
  const mapContainerRef: React.RefCallback<HTMLDivElement> = useCallback(
    (el: HTMLDivElement | null) => {
      if (el && !parentElSetRef.current) {
        parentElRef.current = el;
        parentElSetRef.current = true;
      }
      if (!el && parentElSetRef.current) {
        parentElRef.current = null;
        parentElSetRef.current = false;
      }
    },
    [],
  );

  return { mapContainerRef, map, ready };
}

export type { UseMapInstanceOptions, UseMapInstanceReturn };
