/**
 * useBudgetProgress — 与 PC hooks/useBudgetProgress API 对齐
 */
import { useMemo } from "react";
import {
  getBudgetVariant,
  sortBudgetCategoriesByRisk,
  type BudgetCategoryLike,
  type BudgetVariant,
} from "../utils/budget";

export function useBudgetProgress<T extends BudgetCategoryLike>(
  overallProgress: number | undefined,
  categories: T[] | undefined,
  topN = 4,
) {
  const overallVariant: BudgetVariant = getBudgetVariant(overallProgress ?? 0);
  const topCategories = useMemo(
    () => (categories?.length ? sortBudgetCategoriesByRisk(categories, topN) : ([] as T[])),
    [categories, topN],
  );
  return { overallVariant, topCategories };
}
