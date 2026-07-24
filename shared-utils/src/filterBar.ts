/**
 * FilterBar class — PC 过滤栏
 */

import { cx, type ClassValue } from './cx'

export type FilterBarVariant = 'default' | 'compact' | 'header'

export function buildFilterBarClassName(opts: {
  variant?: FilterBarVariant
  className?: ClassValue
  prefix?: string
} = {}): string {
  const variant = opts.variant || 'default'
  const prefix = opts.prefix || 'filter-bar'
  return cx(
    prefix,
    variant === 'compact' && `${prefix}--compact`,
    variant === 'header' && `${prefix}--header`,
    opts.className,
  )
}
