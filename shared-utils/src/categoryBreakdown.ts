/**
 * 分类占比合并 / 汇总 — 报表与统计页共用
 */

export type BreakdownAmountItem = {
  amount?: number | string | null
}

export type MergedBreakdownItem<T extends BreakdownAmountItem = BreakdownAmountItem> = T & {
  type: 'expense' | 'income'
}

/** 支出+收入合并后按金额降序 */
export function mergeSortedBreakdowns<T extends BreakdownAmountItem>(
  exp: readonly T[] = [],
  inc: readonly T[] = [],
): Array<MergedBreakdownItem<T>> {
  const merged: Array<MergedBreakdownItem<T>> = [
    ...exp.map((d) => ({ ...d, type: 'expense' as const })),
    ...inc.map((d) => ({ ...d, type: 'income' as const })),
  ]
  return merged.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
}

export function sumBreakdownAmounts(items: readonly BreakdownAmountItem[] = []): number {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
}
