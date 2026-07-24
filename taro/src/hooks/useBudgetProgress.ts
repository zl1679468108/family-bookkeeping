/**
 * useBudgetProgress — 与 PC hooks/useBudgetProgress API 对齐
 * 纯计算见 shared-utils selectBudgetProgressView
 */
import { useMemo } from "react";
import {
  selectBudgetProgressView,
  type BudgetCategoryLike,
  type BudgetVariant,
} from "../utils/budget";

export function useBudgetProgress<T extends BudgetCategoryLike>(
  overallProgress: number | undefined,
  categories: T[] | undefined,
  topN = 4,
) {
  return useMemo(
    () => selectBudgetProgressView(overallProgress, categories, topN),
    [overallProgress, categories, topN],
  ) as { overallVariant: BudgetVariant; topCategories: T[] };
}
