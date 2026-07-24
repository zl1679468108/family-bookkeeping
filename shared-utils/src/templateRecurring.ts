/**
 * 周期模板 — 下次执行日 / 是否到期（PC 模板页与后续 Taro 对齐）
 */

import { formatBeijingYMD } from './date'

export type RecurringTemplateLike = {
  frequency?: string | null
  start_date?: string | null
  end_date?: string | null
  last_executed_at?: string | null
}

/** frequency → 月增量；daily/weekly 用 0 表示按日/周加 */
const FREQ_ADD_MONTHS: Record<string, number> = {
  daily: 0,
  weekly: 0,
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

/**
 * 计算下次可执行日期（YYYY-MM-DD，北京时间口径）
 * - 从未执行且 start_date ≤ today → today
 * - 有 last_executed_at → 按 frequency 推进
 * - 否则 → start_date 或 today
 */
export function getNextExecutionDate(
  t: RecurringTemplateLike,
  today: string = formatBeijingYMD(),
): string {
  if (!t.last_executed_at && t.start_date && t.start_date <= today) return today

  if (t.last_executed_at) {
    const base = new Date(t.last_executed_at)
    if (Number.isNaN(base.getTime())) return t.start_date || today

    const freq = String(t.frequency || '')
    const addMonths = FREQ_ADD_MONTHS[freq] ?? 1
    if (addMonths === 0) {
      base.setDate(base.getDate() + (freq === 'weekly' ? 7 : 1))
    } else {
      base.setMonth(base.getMonth() + addMonths)
    }
    return formatBeijingYMD(base)
  }

  return t.start_date || today
}

/** 是否有 frequency 且未过 end_date、下次执行日已到 */
export function isRecurringDue(
  t: RecurringTemplateLike,
  today: string = formatBeijingYMD(),
): boolean {
  if (!t.frequency) return false
  if (t.end_date && t.end_date < today) return false
  return getNextExecutionDate(t, today) <= today
}

export function filterDueRecurringTemplates<T extends RecurringTemplateLike>(
  list: readonly T[] | null | undefined,
  today: string = formatBeijingYMD(),
): T[] {
  if (!list?.length) return []
  return list.filter((item) => isRecurringDue(item, today))
}

export function countDueRecurringTemplates(
  list: readonly RecurringTemplateLike[] | null | undefined,
  today: string = formatBeijingYMD(),
): number {
  return filterDueRecurringTemplates(list, today).length
}

export function hasDueRecurringTemplates(
  list: readonly RecurringTemplateLike[] | null | undefined,
  today: string = formatBeijingYMD(),
): boolean {
  if (!list?.length) return false
  return list.some((item) => isRecurringDue(item, today))
}
