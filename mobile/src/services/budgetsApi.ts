/**
 * Budgets API service.
 */

import apiClient from './api';
import type {
  BudgetRecord,
  BudgetStatus,
  UpsertBudgetInput,
  CopyBudgetInput,
} from '../types';

const BUDGETS_PATH = '/budgets';

/** Get user budgets for a month */
export const fetchBudgets = async (month: string): Promise<BudgetRecord[]> => {
  const { data } = await apiClient.get<BudgetRecord[]>(
    `${BUDGETS_PATH}?month=${encodeURIComponent(month)}`,
  );
  return data;
};

/** Get budget execution status */
export const fetchBudgetStatus = async (
  month: string,
): Promise<BudgetStatus> => {
  const { data } = await apiClient.get<BudgetStatus>(
    `${BUDGETS_PATH}/status?month=${encodeURIComponent(month)}`,
  );
  return data;
};

/** Batch save budgets (upsert) */
export const upsertBudgets = async (
  input: UpsertBudgetInput,
): Promise<BudgetRecord[]> => {
  const { data } = await apiClient.put<BudgetRecord[]>(BUDGETS_PATH, input);
  return data;
};

/** Copy previous month budgets */
export const copyBudgets = async (
  input: CopyBudgetInput,
): Promise<BudgetRecord[]> => {
  const { data } = await apiClient.post<BudgetRecord[]>(
    `${BUDGETS_PATH}/copy`,
    input,
  );
  return data;
};
