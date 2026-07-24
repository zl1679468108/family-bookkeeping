import { request } from './api';
import type { BudgetRecord, BudgetStatus, UpsertBudgetInput, CopyBudgetInput } from '@family-bookkeeping/shared-types';
import { API_PATHS } from '../utils/apiPaths';

/**
 * 获取用户预算列表
 * GET /api/budgets?month=YYYY-MM
 */
export const fetchBudgets = async (month: string): Promise<BudgetRecord[]> => {
  return request<BudgetRecord[]>(API_PATHS.budgets.list(month), {
    requiresAuth: true,
  });
};

/**
 * 获取预算执行状态
 * GET /api/budgets/status?month=YYYY-MM
 */
export const fetchBudgetStatus = async (month: string): Promise<BudgetStatus> => {
  return request<BudgetStatus>(API_PATHS.budgets.status(month), {
    requiresAuth: true,
  });
};

/**
 * 批量保存预算（upsert）
 * PUT /api/budgets
 */
export const upsertBudgets = async (input: UpsertBudgetInput): Promise<BudgetRecord[]> => {
  return request<BudgetRecord[]>(API_PATHS.budgets.root, {
    method: 'PUT',
    requiresAuth: true,
    body: input,
  });
};

/**
 * 复制上月预算到指定月份
 * POST /api/budgets/copy
 */
export const copyBudgets = async (input: CopyBudgetInput): Promise<BudgetRecord[]> => {
  return request<BudgetRecord[]>(API_PATHS.budgets.copy, {
    method: 'POST',
    requiresAuth: true,
    body: input,
  });
};
