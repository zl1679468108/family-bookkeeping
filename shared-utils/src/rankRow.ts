/**
 * RankRow class — PC RankList / Taro RankRow 共用
 */

import { cx, type ClassValue } from './cx'
import type { RankStatus, RankType } from './rankProgress'

export function buildRankRowClassName(opts: {
  type?: RankType
  status?: RankStatus | null
  clickable?: boolean
  className?: ClassValue
  /** PC: rank-row；Taro: ui-rank-row */
  prefix?: string
  /** pc: 仅根 class；bem: 带 type/status/clickable 修饰 */
  mode?: 'pc' | 'bem'
} = {}): string {
  const prefix = opts.prefix || (opts.mode === 'bem' ? 'ui-rank-row' : 'rank-row')
  if (opts.mode === 'bem') {
    const type = opts.type || 'neutral'
    return cx(
      prefix,
      `${prefix}--${type}`,
      opts.status && `${prefix}--${opts.status}`,
      opts.clickable && `${prefix}--clickable`,
      opts.className,
    )
  }
  return cx(prefix, opts.className)
}

/** PC RankList 进度条 fill + tone */
export function buildRankFillClassName(opts: {
  tone?: string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'fill'
  return cx(prefix, opts.tone, opts.className)
}

/** Taro ReportRank 金额 tone */
export function buildRankListAmountClassName(opts: {
  type?: RankType | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-rank-list__amount'
  const type = opts.type || 'neutral'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}

