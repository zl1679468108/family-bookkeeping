/**
 * list-card 排序/聚焦 class — Categories / Templates / Budgets
 */

import { cx, type ClassValue } from './cx'

export function buildListCardClassName(opts: {
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
