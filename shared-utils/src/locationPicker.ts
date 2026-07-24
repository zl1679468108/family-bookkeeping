/**
 * LocationPicker class — Taro 选点
 */

import { cx, type ClassValue } from './cx'

export function buildLocateBtnClassName(opts: {
  loading?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'lp-locate'
  return cx(prefix, opts.loading && `${prefix}--loading`, opts.className)
}

export function buildAccuracyClassName(opts: {
  low?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'lp-accuracy'
  return cx(prefix, opts.low && `${prefix}--low`, opts.className)
}
