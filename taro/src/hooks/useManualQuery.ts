/**
 * ============================================================
 * useManualQuery — 手动数据获取 Hook
 * ============================================================
 *
 * 【为什么不用 React Query 的 useQuery？】
 * useQuery 在 Taro 小程序环境下，enabled 从 false→true 的自动激活
 * 不工作，导致登录后接口不会被调用。
 *
 * 【这个 Hook 做了什么？】
 * 替代 useQuery，提供相同的数据获取能力：
 *   - key 变化时自动重新请求（类似 queryKey）
 *   - 认证完成（user 不为 null）后才发起请求
 *   - 可选短 TTL 内存缓存，减少页间来回重复请求
 *   - 返回 data / isLoading / isFetching / refetch
 *
 * 【使用方式】
 *   const { data, isLoading } = useManualQuery({
 *     key: `summary-${month}`,
 *     queryFn: () => fetchSummary(),
 *     enabled: true,
 *     staleTime: 30_000, // 可选，默认 30s；0 表示不缓存
 *   });
 *
 * 写操作成功后请手动 refetch()，或调用 invalidateManualQuery(prefix)。
 * ============================================================
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

interface CacheEntry {
  data: unknown;
  at: number;
  userId: string;
}

/** 模块级短缓存：key → entry（按 user 隔离） */
const queryCache = new Map<string, CacheEntry>();

const DEFAULT_STALE_TIME = 30_000;

/** 使缓存失效：prefix 匹配 key 前缀，不传则清空当前用户相关全部 */
export function invalidateManualQuery(prefix?: string): void {
  if (!prefix) {
    queryCache.clear();
    return;
  }
  for (const k of Array.from(queryCache.keys())) {
    // 支持完整 key / 前缀 / 业务 key 片段（缓存 key 形态为 `${userId}::${key}`）
    if (k === prefix || k.startsWith(prefix) || k.includes(`::${prefix}`) || k.includes(prefix)) {
      queryCache.delete(k);
    }
  }
}

interface UseManualQueryOptions<T> {
  /** 查询标识，变化时重新请求（类似 queryKey 序列化后的字符串） */
  key: string;
  /** 查询函数，返回 Promise<T> */
  queryFn: () => Promise<T>;
  /** 是否启用（默认 true，但需等认证完成） */
  enabled?: boolean;
  /**
   * 新鲜度窗口（ms）。在窗口内同 key 复用缓存，避免页间来回重复打接口。
   * 设为 0 关闭缓存。默认 30s。
   */
  staleTime?: number;
}

interface UseManualQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useManualQuery<T>({
  key,
  queryFn,
  enabled = true,
  staleTime = DEFAULT_STALE_TIME,
}: UseManualQueryOptions<T>): UseManualQueryResult<T> {
  const { user } = useAuth();
  const userId = user?.id || "";
  const cacheKey = userId ? `${userId}::${key}` : key;

  const [data, setData] = useState<T | undefined>(() => {
    if (!userId || staleTime <= 0) return undefined;
    const hit = queryCache.get(cacheKey);
    if (hit && hit.userId === userId && Date.now() - hit.at < staleTime) {
      return hit.data as T;
    }
    return undefined;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef("");
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const fetch = useCallback(
    (opts?: { force?: boolean }) => {
      if (!enabled || !user) {
        setIsLoading(false);
        return;
      }

      if (!opts?.force && staleTime > 0) {
        const hit = queryCache.get(cacheKey);
        if (hit && hit.userId === userId && Date.now() - hit.at < staleTime) {
          setData(hit.data as T);
          setIsLoading(false);
          setIsFetching(false);
          setError(null);
          return;
        }
      }

      setIsFetching(true);
      setError(null);
      setIsLoading((prev) => (data === undefined ? true : prev));

      queryFnRef
        .current()
        .then((res) => {
          setData(res);
          if (staleTime > 0 && userId) {
            queryCache.set(cacheKey, { data: res, at: Date.now(), userId });
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
        })
        .then(() => {
          setIsLoading(false);
          setIsFetching(false);
        });
    },
    // data used only for loading flag; intentionally not full dep of queryFn
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, user, userId, cacheKey, staleTime],
  );

  useEffect(() => {
    if (key !== lastKey.current) {
      lastKey.current = key;
      // 切换 key：先尝试读缓存再请求
      let cached: T | undefined;
      if (userId && staleTime > 0) {
        const hit = queryCache.get(cacheKey);
        if (hit && hit.userId === userId && Date.now() - hit.at < staleTime) {
          cached = hit.data as T;
        }
      }
      setData(cached);
      setIsLoading(cached === undefined);
      if (cached !== undefined) {
        setIsFetching(false);
        setError(null);
        return;
      }
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user, enabled, cacheKey]);

  const refetch = useCallback(() => {
    if (userId) {
      queryCache.delete(cacheKey);
    }
    fetch({ force: true });
  }, [fetch, cacheKey, userId]);

  const result = useMemo<UseManualQueryResult<T>>(
    () => ({ data, isLoading, isFetching, error, refetch }),
    [data, isLoading, isFetching, error, refetch],
  );

  return result;
}
