/** className 拼接 — 双端组件通用 */

export type ClassValue = string | false | null | undefined | 0 | 0n

/** 过滤假值后用空格连接 */
export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}
