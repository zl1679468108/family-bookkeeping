/**
 * ConfirmDialog class — Taro 确认弹窗（cd-*）
 */

import { cx, type ClassValue } from './cx'

export function buildConfirmDialogMaskClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cd-mask'
  return cx(prefix, opts.className)
}

export function buildConfirmDialogClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cd-dialog'
  return cx(prefix, opts.className)
}
