/**
 * 成员在线/离线判定 — 地图成员位置层等共用
 */

/** 默认离线阈值：2 分钟 */
export const MEMBER_OFFLINE_THRESHOLD_MS = 120_000

/** 将时间戳解析为 ms；非法返回 null */
export function toEpochMs(input: string | number | Date | null | undefined): number | null {
  if (input === null || input === undefined || input === '') return null
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null
  }
  if (input instanceof Date) {
    const t = input.getTime()
    return Number.isNaN(t) ? null : t
  }
  const t = new Date(String(input)).getTime()
  return Number.isNaN(t) ? null : t
}

/**
 * 是否离线：无时间戳 / 超过阈值视为离线
 * @param lastActiveAt 最后活跃时间
 * @param nowMs 当前时间 ms
 * @param thresholdMs 阈值
 */
export function isMemberOffline(
  lastActiveAt: string | number | Date | null | undefined,
  nowMs: number = Date.now(),
  thresholdMs: number = MEMBER_OFFLINE_THRESHOLD_MS,
): boolean {
  const ts = toEpochMs(lastActiveAt)
  if (ts === null) return true
  return nowMs - ts > thresholdMs
}
