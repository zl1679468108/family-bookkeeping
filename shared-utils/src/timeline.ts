/**
 * About 更新日志时间线 class — PC / Taro About 共用
 */

import { cx, type ClassValue } from './cx'

export function buildTimelineItemClassName(opts: {
  latest?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'timeline-item'
  return cx(prefix, opts.latest && `${prefix}--latest`, opts.className)
}

export function buildTimelineChevronClassName(opts: {
  expanded?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'timeline-chevron'
  return cx(prefix, opts.expanded && 'expanded', opts.className)
}

export function buildTimelineChangesClassName(opts: {
  expanded?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'timeline-changes'
  return cx(prefix, opts.expanded && 'expanded', opts.className)
}
