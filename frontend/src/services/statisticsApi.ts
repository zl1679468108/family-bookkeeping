/**
 * Statistics 模块 - API 服务层
 * 对接后端 /api/statistics/* 接口，复用 services/api.ts 中的 request<T>() 函数
 */

import { request } from './api';
import type {
  StatisticsSummary,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  DailySummaryItem,
  YoYComparisonItem,
  SummaryParams,
  MonthlyTrendParams,
  CategoryBreakdownParams,
  DailySummaryParams,
  YoYComparisonParams,
} from '../types/statistics';
import type { MemberComparisonItem, MemberComparisonParams } from '../types/memberComparison';

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
  if (params.endDate !== undefined) {
    query.append('endDate', params.endDate);
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

/**
 * 获取每日汇总（现金流日历用）
 * GET /api/statistics/daily-summary?month=YYYY-MM
 */
export const fetchDailySummary = async (
  params: DailySummaryParams,
): Promise<DailySummaryItem[]> => {
  const query = new URLSearchParams({ month: params.month }).toString();
  return request<DailySummaryItem[]>(`/statistics/daily-summary?${query}`, {
    requiresAuth: true,
  });
};

/**
 * 获取年度对比数据
 * GET /api/statistics/yoy-comparison?year=2026&compareYear=2024&type=expense
 */
export const fetchYearOverYear = async (
  params: YoYComparisonParams,
): Promise<YoYComparisonItem[]> => {
  const query = new URLSearchParams();
  if (params.year !== undefined) query.append('year', String(params.year));
  if (params.compareYear !== undefined) query.append('compareYear', String(params.compareYear));
  if (params.type !== undefined) query.append('type', params.type);
  return request<YoYComparisonItem[]>(`/statistics/yoy-comparison?${query.toString()}`, {
    requiresAuth: true,
  });
};

/**
 * 获取多成员对比数据
 * GET /api/statistics/member-comparison?book_id=...&month_from=...&month_to=...
 */
export const fetchMemberComparison = async (
  params: MemberComparisonParams,
): Promise<MemberComparisonItem[]> => {
  const query = new URLSearchParams({
    book_id: params.book_id,
    month_from: params.month_from,
    month_to: params.month_to,
  }).toString();
  return request<MemberComparisonItem[]>(`/statistics/member-comparison?${query}`, {
    requiresAuth: true,
  });
};
