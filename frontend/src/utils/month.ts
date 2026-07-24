/**
 * 月份区间工具 — 与 Taro useMonthSelector 对齐
 */
import { formatDateYMD } from './date'

/** 某年某月的起止日期 YYYY-MM-DD（month 1-12） */
export function monthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return { start: formatDateYMD(start), end: formatDateYMD(end) }
}

/** 月份 key：YYYY-MM-01 */
export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/** 解析 YYYY-MM-01 / YYYY-MM-DD → { year, month } */
export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}
