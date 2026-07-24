/**
 * 月份选择状态纯辅助 — 与 hooks 配合（端侧保留 useState）
 */

import { monthDateRange, toMonthKey } from './month'

export type YearMonth = { year: number; month: number }

export function currentYearMonth(now: Date = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function resolveYearMonth(
  options: { initialYear?: number; initialMonth?: number; now?: Date } = {},
): YearMonth {
  const now = options.now ?? new Date()
  const cur = currentYearMonth(now)
  return {
    year: options.initialYear ?? cur.year,
    month: options.initialMonth ?? cur.month,
  }
}

export function yearMonthDateRange(year: number, month: number): { start: string; end: string } {
  return monthDateRange(year, month)
}

export function yearMonthKey(year: number, month: number): string {
  return toMonthKey(year, month)
}

/** 月份加减（delta 可为负），自动跨年 */
export function shiftYearMonth(year: number, month: number, delta = 1): YearMonth {
  const idx = year * 12 + (month - 1) + delta
  const y = Math.floor(idx / 12)
  const m = (idx % 12) + 1
  return { year: y, month: m }
}

/** 解析 YYYY-MM / YYYY-M key */
export function parseYearMonthKey(key: string): YearMonth | null {
  if (!key) return null
  const parts = String(key).split('-').map(Number)
  if (parts.length < 2 || !parts[0] || !parts[1]) return null
  const year = parts[0]
  const month = parts[1]
  if (month < 1 || month > 12) return null
  return { year, month }
}

/** YYYY-MM（报表对比等，无日） */
export function toYearMonthString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

/** 当前月 ± delta → YYYY-MM */
export function shiftToYearMonthString(delta = 0, now: Date = new Date()): string {
  const cur = currentYearMonth(now)
  const next = shiftYearMonth(cur.year, cur.month, delta)
  return toYearMonthString(next.year, next.month)
}
