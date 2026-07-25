/**
 * AddTransaction class — Taro 记一笔页面操作栏
 */

import { cx, type ClassValue } from './cx'

export function buildAddTxSaveClassName(opts: {
  full?: boolean
  disabled?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'addtx-actions__save'
  return cx(
    prefix,
    opts.full && `${prefix}--full`,
    opts.disabled && `${prefix}--disabled`,
    opts.className,
  )
}

export function addTransactionEditPath(id: string | number): string {
  return `/add?edit=${id}`
}
