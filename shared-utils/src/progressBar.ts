/**
 * ProgressBar class — Taro 进度条
 */

import { cx, type ClassValue } from './cx'

export function buildProgressBarFillClassName(opts: {
  danger?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'progress-bar-fill'
  return cx(prefix, opts.danger && `${prefix}--danger`, opts.className)
}
