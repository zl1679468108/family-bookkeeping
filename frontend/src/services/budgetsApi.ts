/**
 * Budgets 模块 - API 服务层
 * 对接后端 /api/budgets/* 接口
 */

import { request } from './api';
import type { BudgetRecord, BudgetStatus, UpsertBudgetInput, CopyBudgetInput } from '../types/budget';

/**
 * 获取用户某月所有预算记录
 * GET /api/budgets?month=2025-03-01
 */
export const fetchBudgets = async (month: string): Promise<BudgetRecord[]> => {
  return request<BudgetRecord[]>(`/budgets?month=${encodeURIComponent(month)}`, {
    requiresAuth: true,
  });
};

/**
 * 获取预算执行状态
 * GET /api/budgets/status?month=2025-03-01
 */
export const fetchBudgetStatus = async (month: string): Promise<BudgetStatus> => {
  return request<BudgetStatus>(`/budgets/status?month=${encodeURIComponent(month)}`, {
    requiresAuth: true,
  });
};

/**
 * 批量保存预算（upsert 语义）
 * PUT /api/budgets
 */
export const upsertBudgets = async (input: UpsertBudgetInput): Promise<BudgetRecord[]> => {
  return request<BudgetRecord[]>('/budgets', {
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
  return request<BudgetRecord[]>('/budgets/copy', {
    method: 'POST',
    requiresAuth: true,
    body: input,
  });
};
