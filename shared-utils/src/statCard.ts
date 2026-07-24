/**
 * StatCard 变体 / class — PC / Taro 统计卡共用
 */

import { cx, type ClassValue } from './cx'

export type StatCardVariant = 'default' | 'income' | 'expense' | 'hero'

/**
 * @param mode pc: `stat-card income`；bem: `ui-stat ui-stat--income`
 */
export function buildStatCardClassName(opts: {
  variant?: StatCardVariant
  className?: ClassValue
  mode?: 'pc' | 'bem'
  prefix?: string
} = {}): string {
  const variant = opts.variant || 'default'
  const mode = opts.mode || 'pc'
  if (mode === 'bem') {
    const prefix = opts.prefix || 'ui-stat'
    return cx(prefix, `${prefix}--${variant}`, opts.className)
  }
  const prefix = opts.prefix || 'stat-card'
  return cx(prefix, variant !== 'default' && variant, opts.className)
}
