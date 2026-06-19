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
 *   - 返回 data / isLoading / isFetching / refetch
 *
 * 【使用方式】
 *   const { data, isLoading } = useManualQuery({
 *     key: `summary-${month}`,        // 变化时自动重新请求
 *     queryFn: () => fetchSummary(),   // 实际的 API 调用
 *     enabled: true,                   // 可选，默认 true
 *   });
 *
 * 【与 React Query 的区别】
 *   - 不缓存数据（每次 key 变化都重新请求）
 *   - 不支持 staleTime（每次都发请求）
 *   - 不支持请求去重（同时多个组件会发多次）
 *
 * 小程序数据量小，这些限制不影响使用。
 * ============================================================
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

interface UseManualQueryOptions<T> {
  /** 查询标识，变化时重新请求（类似 queryKey 序列化后的字符串） */
  key: string;
  /** 查询函数，返回 Promise<T> */
  queryFn: () => Promise<T>;
  /** 是否启用（默认 true，但需等认证完成） */
  enabled?: boolean;
}

interface UseManualQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
}

export function useManualQuery<T>({
  key,
  queryFn,
  enabled = true,
}: UseManualQueryOptions<T>): UseManualQueryResult<T> {
  // 从 AuthContext 获取用户状态，确保认证完成后才发请求
  const { user } = useAuth();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const lastKey = useRef("");

  const fetch = () => {
    if (!enabled || !user) return;
    setIsFetching(true);
    if (!data) setIsLoading(true);
    queryFn()
      .then((res) => {
        setData(res);
      })
      .catch(() => {
        // 静默处理错误，由调用方决定是否展示
      })
      .finally(() => {
        setIsLoading(false);
        setIsFetching(false);
      });
  };

  useEffect(() => {
    // key 变化时清空旧数据，重新请求
    if (key !== lastKey.current) {
      lastKey.current = key;
      setData(undefined);
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user, enabled]);

  // 关键：缓存返回值，避免每次渲染都生成新对象触发子组件重渲染
  const result = useMemo<UseManualQueryResult<T>>(
    () => ({ data, isLoading, isFetching, refetch: fetch }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, isLoading, isFetching],
  );

  return result;
}
