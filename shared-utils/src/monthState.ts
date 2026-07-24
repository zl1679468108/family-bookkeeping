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
