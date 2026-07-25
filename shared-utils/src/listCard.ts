/**
 * list-card 排序/聚焦 class — Categories / Templates / Budgets
 */

import { cx, type ClassValue } from './cx'

export function buildListCardClassName(opts: {
  active?: boolean
  dragging?: boolean
  focused?: boolean
  statusClass?: string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'list-card'
  return cx(
    prefix,
    opts.statusClass,
    opts.active && 'is-active',
    opts.dragging && 'dragging',
    opts.focused && 'spotlight--focused',
    opts.className,
  )
}

export function buildListCardGridClassName(opts: {
  sortMode?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'list-card-grid'
  return cx(prefix, opts.sortMode && 'sort-mode', opts.className)
}

export function buildListCardBadgeClassName(opts: {
  type?: string | null
  kind?: 'default' | 'custom' | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'list-card__badge'
  if (opts.kind) return cx(prefix, `${prefix}--${opts.kind}`, opts.className)
  const type = opts.type || 'expense'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}

export function buildListCardAmountClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'list-card__amt'
  const type = opts.type || 'expense'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}
