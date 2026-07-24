/**
 * Toast 内容 class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildToastContentClassName(opts: {
  animating?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'toast-content'
  return cx(prefix, opts.animating && 'toast-show', opts.className)
}
