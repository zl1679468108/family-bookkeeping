/**
 * Spinner class — PC ui-spinner / Taro ui-spin
 */

import { cx, type ClassValue } from './cx'

export type SpinnerSize = 'sm' | 'md'

/** PC 线框 spinner */
export function buildSpinnerClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-spinner'
  return cx(prefix, opts.className)
}

/** Taro 尺寸 spinner */
export function buildSpinClassName(opts: {
  size?: SpinnerSize
  className?: ClassValue
  prefix?: string
} = {}): string {
  const size = opts.size || 'sm'
  const prefix = opts.prefix || 'ui-spin'
  return cx(prefix, `${prefix}--${size}`, opts.className)
}
