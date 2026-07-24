/**
 * FloatingAction class — Taro 悬浮操作按钮
 */

import { cx, type ClassValue } from './cx'

export function buildFloatingActionClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'floating-action'
  return cx(prefix, opts.className)
}
