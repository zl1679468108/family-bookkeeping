/**
 * FilterChip class — PC 筛选标签
 */

import { cx, type ClassValue } from './cx'

export function buildFilterChipClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'filter-chip'
  return cx(prefix, opts.className)
}
