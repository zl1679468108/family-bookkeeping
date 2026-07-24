/**
 * UI Icon 根 class — PC / Taro Icon 共用
 */

import { cx, type ClassValue } from './cx'

export function buildUiIconClassName(opts: {
  mask?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-icon'
  return cx(prefix, opts.mask && `${prefix}--mask`, opts.className)
}
