/**
 * Badge class — Taro ui-badge / PC 列表徽标语义对齐
 */

import { cx, type ClassValue } from './cx'

export type BadgeVariant = 'default' | 'primary' | 'income' | 'expense' | 'warn' | 'info'
export type BadgeSize = 'sm' | 'md'

export function buildBadgeClassName(opts: {
  variant?: BadgeVariant
  size?: BadgeSize
  className?: ClassValue
  prefix?: string
} = {}): string {
  const variant = opts.variant || 'default'
  const size = opts.size || 'sm'
  const prefix = opts.prefix || 'ui-badge'
  return cx(prefix, `${prefix}--${variant}`, `${prefix}--${size}`, opts.className)
}
