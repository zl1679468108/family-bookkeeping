/**
 * 排行/进度行纯计算 — PC RankList / Taro RankRow 同源
 */

export type RankStatus = 'safe' | 'warn' | 'danger'
export type RankType = 'income' | 'expense' | 'neutral'

/** 优先 progress；否则 amount/totalAmount → 0-100 */
export function resolveRankProgress(
  amount?: number | null,
  totalAmount?: number | null,
  progress?: number | null,
): number | undefined {
  if (progress !== undefined && progress !== null && Number.isFinite(Number(progress))) {
    return Number(progress)
  }
  if (
    totalAmount !== undefined &&
    totalAmount !== null &&
    Number(totalAmount) > 0 &&
    amount !== undefined &&
    amount !== null
  ) {
    return Math.round((Number(amount) / Number(totalAmount)) * 100)
  }
  return undefined
}

export function clampPercent(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

/** 进度条 fill 语义：danger/warn 优先，否则按 type */
export function rankFillTone(
  status?: RankStatus | null,
  type: RankType = 'expense',
): 'danger' | 'warn' | 'income' | 'safe' {
  if (status === 'danger') return 'danger'
  if (status === 'warn') return 'warn'
  if (type === 'income') return 'income'
  return 'safe'
}
