/**
 * SegmentedControl item class — Taro（旧实现，新页优先 SegControl）
 */

import { cx, type ClassValue } from './cx'

export function buildSegmentedItemClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'segmented-item'
  return cx(prefix, opts.active && 'segmented-item-active', opts.className)
}
