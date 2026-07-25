/**
 * Calendar 结余展示 class — PC
 */

import { cx, type ClassValue } from './cx'

export function buildCalendarBalanceClassName(opts: {
  nonNegative?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cs-val'
  return cx(prefix, opts.nonNegative ? 'inc' : 'exp', opts.className)
}

/** 日历格子：today / has-data */
export function buildCalendarCellClassName(opts: {
  today?: boolean
  hasData?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cal-cell'
  return cx(prefix, opts.today && 'today', opts.hasData && 'has-data', opts.className)
}

/** 日历格子农历/节日副标题：festival */
export function buildCalendarSubClassName(opts: {
  festival?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cd-sub'
  return cx(prefix, opts.festival && 'festival', opts.className)
}

/** 节假日角标：work（补班）/ rest（放假）/ normal */
export function buildHolidayTagClassName(opts: {
  isWork?: boolean | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cal-detail-holiday'
  const tone = opts.isWork === true ? 'work' : opts.isWork === false ? 'rest' : 'normal'
  return cx(prefix, tone, opts.className)
}
