/**
 * BottomSheet body class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildBottomSheetBodyClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bs-sheet__body'
  return cx(prefix, opts.className)
}
