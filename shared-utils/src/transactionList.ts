/**
 * 流水列表纯函数 — 时间/类型筛选、按日分组、日期标题、收支汇总
 * PC / Taro 流水页共用，保证近 7 天 / 近 30 天口径一致
 */

import { formatBeijingYMD, formatDateYMD, parseDateInput } from './date'

export type TransactionTimeFilterKey = 'all' | 'last7' | 'last30'
export type TransactionTypeFilter = 'expense' | 'income' | undefined

export const UNKNOWN_TRANSACTION_DATE = '未知日期'

/**
 * 归一化时间筛选：
 * - PC URL: week / month / ''
 * - Taro Picker 索引: 0 / 1 / 2
 * - 显式: last7 / last30 / all
 */
export function normalizeTransactionTimeFilter(
  input: string | number | null | undefined,
): TransactionTimeFilterKey {
  if (input === 1 || input === 'week' || input === 'last7' || input === '7') return 'last7'
  if (input === 2 || input === 'month' || input === 'last30' || input === '30') return 'last30'
  return 'all'
}

/** Taro 类型 Picker：0 全部 / 1 支出 / 2 收入 */
export function typeFilterFromIndex(typeIdx: number): TransactionTypeFilter {
  if (typeIdx === 1) return 'expense'
  if (typeIdx === 2) return 'income'
  return undefined
}

export function typeFilterFromValue(
  value: string | null | undefined,
): TransactionTypeFilter {
  if (value === 'expense' || value === 'income') return value
  return undefined
}

/**
 * 时间筛选 → startDate / endDate（含今天）
 * - last7: today-6 .. today（共 7 天）
 * - last30: today-29 .. today（共 30 天）
 * - all: 不限
 */
export function transactionTimeDateRange(
  filter: TransactionTimeFilterKey | string | number | null | undefined,
  today: Date = new Date(),
): { startDate?: string; endDate?: string } {
  const key = normalizeTransactionTimeFilter(filter)
  const endDate = formatBeijingYMD(today)
  if (key === 'all') return {}

  const daysBack = key === 'last7' ? 6 : 29
  const start = new Date(today.getTime())
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() - daysBack)
  return { startDate: formatBeijingYMD(start), endDate }
}

export function groupTransactionsByDate<T extends { date?: string | null }>(
  txns: readonly T[] | null | undefined,
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const t of txns || []) {
    const key = String(t.date || '').slice(0, 10) || UNKNOWN_TRANSACTION_DATE
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }
  return groups
}

export function sortedTransactionDateKeys(groups: Record<string, unknown>): string[] {
  return Object.keys(groups).sort().reverse()
}

/**
 * 流水分组标题：今天 / 昨天 / 近 7 天内「周X」 / 同年 M月D日 / 跨年 YYYY-MM-DD
 */
export function formatTransactionDateLabel(
  dateStr: string,
  now: Date = new Date(),
): string {
  if (!dateStr || dateStr === UNKNOWN_TRANSACTION_DATE) {
    return dateStr || UNKNOWN_TRANSACTION_DATE
  }
  const date = parseDateInput(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (day.getTime() === today.getTime()) return '今天'
  if (day.getTime() === yesterday.getTime()) return '昨天'

  const diffDays = Math.floor((today.getTime() - day.getTime()) / 86400000)
  if (diffDays > 0 && diffDays < 7) {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    return `周${weekDays[day.getDay()]}`
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  return formatDateYMD(date)
}

export function sumTransactionsByType(
  txns: readonly { type?: string; amount?: string | number | null }[] | null | undefined,
): { expense: number; income: number } {
  let expense = 0
  let income = 0
  for (const t of txns || []) {
    const n = typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)
    if (!Number.isFinite(n)) continue
    if (t.type === 'income') income += n
    else if (t.type === 'expense') expense += n
  }
  return { expense, income }
}
