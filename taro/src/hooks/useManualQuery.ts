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
  error: Error | null;
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
  const [error, setError] = useState<Error | null>(null);
  const lastKey = useRef("");

  const fetch = () => {
    // T-L13: user 为 null 时关闭 loading，避免卡住
    if (!enabled || !user) {
      setIsLoading(false);
      return;
    }
    setIsFetching(true);
    setError(null);
    if (!data) setIsLoading(true);
    queryFn()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        // T-M9: 暴露错误状态，不再静默吞掉
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .then(() => {
        // 注意：用 .then() 兜底而非 .finally()，规避 Taro/微信 regenerator 下
        // .finally 偶发不执行的隐患，确保 isLoading 一定复位（否则全屏遮罩会卡死拦截点击）
        setIsLoading(false);
        setIsFetching(false);
      });
  };

  useEffect(() => {
    // key 变化时清空旧数据，重新请求
    // 注意：fetch() 内 `if (!data) setIsLoading(true)` 依赖闭包中的 data，
    // 但 setData(undefined) 是异步的，本轮闭包里 data 仍是旧值，
    // 会导致切换月份/账本等 key 变化场景下 isLoading 不变 true、loading 遮罩不显示。
    // 因此在 key 变化分支显式 setIsLoading(true)。
    if (key !== lastKey.current) {
      lastKey.current = key;
      setData(undefined);
      setIsLoading(true);
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user, enabled]);

  // 关键：缓存返回值，避免每次渲染都生成新对象触发子组件重渲染
  const result = useMemo<UseManualQueryResult<T>>(
    () => ({ data, isLoading, isFetching, error, refetch: fetch }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, isLoading, isFetching, error],
  );

  return result;
}
