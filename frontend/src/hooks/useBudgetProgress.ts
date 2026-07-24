/**
 * useBudgetProgress — 预算进度语义（变体 / 排序）
 * 泛型保留分类完整字段，避免丢失 category_id 等业务属性
 */
import { useMemo } from 'react'
import {
  getBudgetVariant,
  sortBudgetCategoriesByRisk,
  type BudgetCategoryLike,
  type BudgetVariant,
} from '../utils/budget'

export function useBudgetProgress<T extends BudgetCategoryLike>(
  overallProgress: number | undefined,
  categories: T[] | undefined,
  topN = 4,
) {
  const overallVariant: BudgetVariant = getBudgetVariant(overallProgress ?? 0)
  const topCategories = useMemo(
    () => (categories?.length ? sortBudgetCategoriesByRisk(categories, topN) : ([] as T[])),
    [categories, topN],
  )
  return { overallVariant, topCategories }
}
