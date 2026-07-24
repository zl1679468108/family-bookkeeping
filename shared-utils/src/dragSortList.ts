/**
 * DragSortList class — Taro 拖拽排序列表
 */

import { cx, type ClassValue } from './cx'

export function buildDragSortListClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'drag-sort-list'
  return cx(prefix, opts.className)
}

export function buildDragSortItemClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'drag-sort-list__item'
  return cx(prefix, opts.active && `${prefix}--active`, opts.className)
}
