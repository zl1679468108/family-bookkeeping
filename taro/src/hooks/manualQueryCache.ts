/**
 * useManualQuery 模块级缓存 — 独立文件，避免 AuthContext 与 hook 循环依赖
 */
interface CacheEntry {
  data: unknown;
  at: number;
  userId: string;
}

/** 模块级短缓存：key → entry（按 user 隔离） */
export const queryCache = new Map<string, CacheEntry>();

/** 进行中的请求：同 key 并发复用同一个 Promise，避免重复打接口 */
export const inflight = new Map<string, Promise<unknown>>();

/** 使缓存失效：prefix 匹配 key 前缀，不传则清空全部 */
export function invalidateManualQuery(prefix?: string): void {
  if (!prefix) {
    queryCache.clear();
    inflight.clear();
    return;
  }
  for (const k of Array.from(queryCache.keys())) {
    // 支持完整 key / 前缀 / 业务 key 片段（缓存 key 形态为 `${userId}::${key}`）
    if (k === prefix || k.startsWith(prefix) || k.includes(`::${prefix}`) || k.includes(prefix)) {
      queryCache.delete(k);
    }
  }
  for (const k of Array.from(inflight.keys())) {
    if (k === prefix || k.startsWith(prefix) || k.includes(`::${prefix}`) || k.includes(prefix)) {
      inflight.delete(k);
    }
  }
}
