/**
 * Statistics 模块 - API 服务层
 * 对接后端 /api/statistics/* 接口，复用 services/api.ts 中的 request<T>() 函数
 */

import { request } from './api';
import type {
  StatisticsSummary,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  SummaryParams,
  MonthlyTrendParams,
  CategoryBreakdownParams,
} from '../types/statistics';

/**
 * 获取统计概览
 * GET /api/statistics/summary?startDate=...&endDate=...
 */
export const fetchSummary = async (params: SummaryParams): Promise<StatisticsSummary> => {
  const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
  return request<StatisticsSummary>(`/statistics/summary?${query}`, { requiresAuth: true });
};

/**
 * 获取月度趋势
 * GET /api/statistics/monthly-trend?months=6&type=expense
 */
export const fetchMonthlyTrend = async (
  params: MonthlyTrendParams,
): Promise<MonthlyTrendItem[]> => {
  const query = new URLSearchParams();
  if (params.months !== undefined) {
    query.append('months', String(params.months));
  }
  if (params.type !== undefined) {
    query.append('type', params.type);
  }
  return request<MonthlyTrendItem[]>(`/statistics/monthly-trend?${query.toString()}`, {
    requiresAuth: true,
  });
};

/**
 * 获取分类占比
 * GET /api/statistics/category-breakdown?startDate=...&endDate=...&type=expense
 */
export const fetchCategoryBreakdown = async (
  params: CategoryBreakdownParams,
): Promise<CategoryBreakdownItem[]> => {
  const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
  return request<CategoryBreakdownItem[]>(`/statistics/category-breakdown?${query}`, {
    requiresAuth: true,
  });
};
