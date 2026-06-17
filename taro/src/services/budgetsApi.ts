/**
 * Budgets API service.
 */

import { apiGet, apiPut, apiPost } from "./api";
import type {
  BudgetRecord,
  BudgetStatus,
  UpsertBudgetInput,
  CopyBudgetInput,
} from "../types";

const BUDGETS_PATH = "/budgets";

/** Get user budgets for a month */
export const fetchBudgets = async (month: string): Promise<BudgetRecord[]> => {
  return apiGet<BudgetRecord[]>(
    `${BUDGETS_PATH}?month=${encodeURIComponent(month)}`,
    { requiresAuth: true },
  );
};

/** Get budget execution status */
export const fetchBudgetStatus = async (
  month: string,
): Promise<BudgetStatus> => {
  return apiGet<BudgetStatus>(
    `${BUDGETS_PATH}/status?month=${encodeURIComponent(month)}`,
    { requiresAuth: true },
  );
};

/** Batch save budgets (upsert) */
export const upsertBudgets = async (
  input: UpsertBudgetInput,
): Promise<BudgetRecord[]> => {
  return apiPut<BudgetRecord[]>(BUDGETS_PATH, { data: input, requiresAuth: true });
};

/** Copy previous month budgets */
export const copyBudgets = async (
  input: CopyBudgetInput,
): Promise<BudgetRecord[]> => {
  return apiPost<BudgetRecord[]>(`${BUDGETS_PATH}/copy`, {
    data: input,
    requiresAuth: true,
  });
};
