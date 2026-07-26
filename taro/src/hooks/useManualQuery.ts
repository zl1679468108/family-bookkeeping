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
import { STALE } from "../utils/cachePolicy";
import { queryCache, inflight } from "./manualQueryCache";

export { invalidateManualQuery } from "./manualQueryCache";

const DEFAULT_STALE_TIME = STALE.default;

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
  /** 当前生效的 cacheKey；用于丢弃切号/换 key 后的过期响应 */
  const activeCacheKeyRef = useRef(cacheKey);
  activeCacheKeyRef.current = cacheKey;
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

      let request = inflight.get(cacheKey) as Promise<T> | undefined;
      if (!request || opts?.force) {
        request = queryFnRef
          .current()
          .then((res) => {
            if (staleTime > 0 && userId) {
              queryCache.set(cacheKey, { data: res, at: Date.now(), userId });
            }
            return res;
          })
          .then(
            (res) => {
              if (inflight.get(cacheKey) === request) inflight.delete(cacheKey);
              return res;
            },
            (err) => {
              if (inflight.get(cacheKey) === request) inflight.delete(cacheKey);
              throw err;
            },
          );
        inflight.set(cacheKey, request);
      }

      const requestCacheKey = cacheKey;
      request
        .then((res) => {
          // 账号切换 / key 变化后丢弃旧请求结果，避免写回错误用户数据
          if (activeCacheKeyRef.current !== requestCacheKey) return;
          setData(res);
        })
        .catch((err) => {
          if (activeCacheKeyRef.current !== requestCacheKey) return;
          setError(err instanceof Error ? err : new Error(String(err)));
        })
        .then(() => {
          if (activeCacheKeyRef.current !== requestCacheKey) return;
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
