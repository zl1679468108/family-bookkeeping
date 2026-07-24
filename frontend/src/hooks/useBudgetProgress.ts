/**
 * useBudgetProgress — 预算进度语义（变体 / 排序）
 * 泛型保留分类完整字段；纯计算见 shared-utils selectBudgetProgressView
 */
import { useMemo } from 'react'
import {
  selectBudgetProgressView,
  type BudgetCategoryLike,
  type BudgetVariant,
} from '../utils/budget'

export function useBudgetProgress<T extends BudgetCategoryLike>(
  overallProgress: number | undefined,
  categories: T[] | undefined,
  topN = 4,
) {
  return useMemo(
    () => selectBudgetProgressView(overallProgress, categories, topN),
    [overallProgress, categories, topN],
  ) as { overallVariant: BudgetVariant; topCategories: T[] }
}
