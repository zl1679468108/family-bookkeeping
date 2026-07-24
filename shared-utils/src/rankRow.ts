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
