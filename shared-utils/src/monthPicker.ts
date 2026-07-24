/**
 * MonthPicker chevron class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildMonthPickerChevronClassName(opts: {
  light?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'month-picker-chevron'
  return cx(prefix, opts.light && 'light', opts.className)
}

export function buildMonthPickerClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'month-picker'
  return cx(prefix, opts.className)
}
