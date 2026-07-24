/**
 * SheetHeader class — Taro 底部 sheet / 抽屉标题栏
 */

import { cx, type ClassValue } from './cx'

export function buildSheetHeaderClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'sheet-header'
  return cx(prefix, opts.className)
}

export function buildSheetHeaderSideClassName(opts: {
  side?: 'left' | 'right'
  className?: ClassValue
  prefix?: string
} = {}): string {
  const side = opts.side || 'left'
  const prefix = opts.prefix || 'sheet-header__side'
  return cx(prefix, `${prefix}--${side}`, opts.className)
}
