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
import { API_PATHS } from "../utils/apiPaths";

/** Get user budgets for a month */
export const fetchBudgets = async (month: string): Promise<BudgetRecord[]> => {
  return apiGet<BudgetRecord[]>(API_PATHS.budgets.list(month), { requiresAuth: true });
};

/** Get budget execution status */
export const fetchBudgetStatus = async (
  month: string,
): Promise<BudgetStatus> => {
  return apiGet<BudgetStatus>(API_PATHS.budgets.status(month), { requiresAuth: true });
};

/** Batch save budgets (upsert) */
export const upsertBudgets = async (
  input: UpsertBudgetInput,
): Promise<BudgetRecord[]> => {
  return apiPut<BudgetRecord[]>(API_PATHS.budgets.root, { data: input, requiresAuth: true });
};

/** Copy previous month budgets */
export const copyBudgets = async (
  input: CopyBudgetInput,
): Promise<BudgetRecord[]> => {
  return apiPost<BudgetRecord[]>(API_PATHS.budgets.copy, {
    data: input,
    requiresAuth: true,
  });
};
