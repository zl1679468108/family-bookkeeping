/**
 * AmapManager — singleton that loads the AMap JS SDK once and manages
 * a pool of AMap.Map instances via DOM-transfer keep-alive.
 *
 * Merges the previous AmapService + MapInstancePool into a single class.
 *
 * Usage:
 *   const amap = AmapManager.getInstance();
 *   await amap.ensureLoaded();         // one-time SDK load
 *   const map = await amap.acquire(id, el, opts);
 *   amap.release(id);                  // keep-alive, not destroy
 *   amap.release(id, true);            // true = destroy immediately
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PoolEntry {
  id: string;
  map: any; // AMap.Map
  container: HTMLDivElement; // pool-owned, NOT React-managed
  inUse: boolean;
  lastUsed: number;
}

/* ------------------------------------------------------------------ */
/*  Shared plugin set                                                  */
/* ------------------------------------------------------------------ */

const ALL_PLUGINS = [
  'AMap.PlaceSearch',
  'AMap.HeatMap',
  'AMap.Geocoder',
  'AMap.Geolocation',
];

/* ------------------------------------------------------------------ */
/*  Class                                                              */
/* ------------------------------------------------------------------ */

class AmapManager {
  private static instance: AmapManager;

  // ---- SDK state ----
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  // ---- Pool state ----
  private pool = new Map<string, PoolEntry>();
  private poolHost: HTMLDivElement | null = null;

  /* ================================================================ */
  /*  Singleton                                                       */
  /* ================================================================ */

  static getInstance(): AmapManager {
    if (!AmapManager.instance) {
      AmapManager.instance = new AmapManager();
    }
    return AmapManager.instance;
  }

  /* ================================================================ */
  /*  AMap API accessor                                               */
  /* ================================================================ */

  /** Direct access to the AMap global (undefined before load). */
  get AMap(): any {
    return (window as any).AMap;
  }

  /** Whether the SDK has finished loading. */
  get isLoaded(): boolean {
    return this.loaded;
  }

  /* ================================================================ */
  /*  SDK loading                                                      */
  /* ================================================================ */

  /**
   * Ensure the AMap JS SDK is loaded (with all required plugins).
   * Idempotent — subsequent calls resolve immediately.
   */
  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    const key = process.env.REACT_APP_AMAP_KEY ?? '';

    this.loadingPromise = new Promise<void>((resolve, reject) => {
      try {
        // Security config MUST be set before the SDK script loads
        const scode = process.env.REACT_APP_AMAP_SECRET;
        if (scode && typeof window !== 'undefined') {
          (window as any)._AMapSecurityConfig = { securityJsCode: scode };
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;

        const pluginParam = ALL_PLUGINS.length
          ? `&plugin=${ALL_PLUGINS.join(',')}`
          : '';
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}${pluginParam}`;

        script.onload = () => {
          this.loaded = true;
          resolve();
        };

        script.onerror = () => {
          this.loadingPromise = null; // allow retry
          reject(new Error('Failed to load AMap SDK'));
        };

        document.head.appendChild(script);
      } catch (err) {
        this.loadingPromise = null;
        reject(err);
      }
    });

    return this.loadingPromise;
  }

  /* ================================================================ */
  /*  Pool host (hidden off-screen container)                          */
  /* ================================================================ */

  private getPoolHost(): HTMLDivElement {
    if (!this.poolHost) {
      this.poolHost = document.createElement('div');
      this.poolHost.style.cssText =
        'position:fixed;top:-9999px;left:-9999px;' +
        'width:100vw;height:100vh;pointer-events:none;opacity:0;z-index:-1';
      document.body.appendChild(this.poolHost);
    }
    return this.poolHost;
  }

  /* ================================================================ */
  /*  acquire                                                          */
  /* ================================================================ */

  /**
   * Get or create a map instance for `id`, placing its pool-owned
   * container inside `parentEl`.
   *
   * ⚠️ Does NOT call map.resize() — the calling code (or ResizeObserver
   *    in the hook) is responsible for sizing the map after layout
   *    settles.  This avoids double-resize that cancels in-flight tiles.
   */
  async acquire(
    id: string,
    parentEl: HTMLDivElement,
    options?: Record<string, any>,
  ): Promise<any> {
    if (!this.loaded) {
      throw new Error('AMap SDK not loaded — call ensureLoaded() first');
    }

    const AMapWin = this.AMap;
    if (!AMapWin) {
      throw new Error('AMap SDK not loaded');
    }

    const pooled = this.pool.get(id);

    // --- Reuse idle instance ---
    if (pooled && !pooled.inUse) {
      parentEl.appendChild(pooled.container);
      pooled.inUse = true;
      // No resize here — let the ResizeObserver in the hook handle it
      return pooled.map;
    }

    // --- Already in use (shouldn't happen) ---
    if (pooled && pooled.inUse) {
      console.warn(
        `[AmapManager] Map "${id}" already in use — creating fresh instance. ` +
        'Check that release() is called before re-acquiring with the same id.',
      );
    }

    // --- Create new instance ---
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    parentEl.appendChild(container);

    const defaultOpts = {
      // 瓦片缓存 & 预加载
      preloadMode: true,
      tileCache: true,
      animateEnable: false,
      // 控制缩放范围减少无效请求
      minZoom: 4,
      maxZoom: 18,
      // 交互保留
      dragEnable: true,
      zoomEnable: true,
      resizeEnable: true,
    };
    const map = new AMapWin.Map(container, { ...defaultOpts, ...(options ?? {}) });

    this.pool.set(id, {
      id,
      map,
      container,
      inUse: true,
      lastUsed: Date.now(),
    });

    return map;
  }

  /* ================================================================ */
  /*  release                                                          */
  /* ================================================================ */

  /**
   * Release a map back to the pool.
   *
   * @param destroy - if true, calls map.destroy() instead of keep-alive.
   */
  release(id: string, destroy = false): void {
    const pooled = this.pool.get(id);
    if (!pooled) return;

    if (destroy) {
      if (pooled.map && typeof pooled.map.destroy === 'function') {
        try { pooled.map.destroy(); } catch { /* best-effort */ }
      }
      if (pooled.container.parentElement) {
        pooled.container.parentElement.removeChild(pooled.container);
      }
      this.pool.delete(id);
      return;
    }

    // Keep-alive: move container to off-screen poolHost
    if (pooled.container.parentElement) {
      pooled.container.parentElement.removeChild(pooled.container);
    }
    pooled.container.style.width = '100%';
    pooled.container.style.height = '100%';
    this.getPoolHost().appendChild(pooled.container);

    pooled.inUse = false;
    pooled.lastUsed = Date.now();

    // Reset persisted state — on re-acquire the container dimensions will
    // have changed (poolHost ≠ real component).
    if (pooled.map) {
      delete (pooled.map as any).__amapLastW;
      delete (pooled.map as any).__amapLastH;
    }

    // ⚠️ No resize here — the map retains its last-known viewport state.
    // Resizing at poolHost's 800×600 would force AMap to recalc tiles,
    // then re-acquire would resize again → double tile cancellation.
  }

  /* ================================================================ */
  /*  destroyIdle                                                      */
  /* ================================================================ */

  /** Destroy idle maps older than maxIdleMs (default 10 minutes). */
  destroyIdle(maxIdleMs = 10 * 60 * 1000): void {
    const now = Date.now();
    const toDelete: string[] = [];
    this.pool.forEach((pooled, id) => {
      if (pooled.inUse) return;
      if (now - pooled.lastUsed < maxIdleMs) return;

      if (pooled.map && typeof pooled.map.destroy === 'function') {
        try { pooled.map.destroy(); } catch { /* best-effort */ }
      }
      if (pooled.container.parentElement) {
        pooled.container.parentElement.removeChild(pooled.container);
      }
      toDelete.push(id);
    });
    for (const id of toDelete) this.pool.delete(id);
  }

  /* ================================================================ */
  /*  Getter for a pooled map (do NOT acquire — read-only)             */
  /* ================================================================ */

  /** Return the pooled map instance without acquiring it. */
  getMap(id: string): any | null {
    return this.pool.get(id)?.map ?? null;
  }
}

export { AmapManager };
export type { };
