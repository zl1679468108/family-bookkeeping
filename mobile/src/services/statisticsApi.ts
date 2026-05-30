/**
 * Statistics API service.
 */

import apiClient from './api';
import type {
  StatisticsSummary,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  SummaryParams,
  MonthlyTrendParams,
  CategoryBreakdownParams,
} from '../types';

const STATISTICS_PATH = '/statistics';

/** Get statistics summary for a date range */
export const fetchSummary = async (
  params: SummaryParams,
): Promise<StatisticsSummary> => {
  const query = new URLSearchParams(
    params as unknown as Record<string, string>,
  ).toString();
  const { data } = await apiClient.get<StatisticsSummary>(
    `${STATISTICS_PATH}/summary?${query}`,
  );
  return data;
};

/** Get monthly trend data */
export const fetchMonthlyTrend = async (
  params: MonthlyTrendParams,
): Promise<MonthlyTrendItem[]> => {
  const query = new URLSearchParams();
  if (params.months) query.append('months', String(params.months));
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.type) query.append('type', params.type);
  const { data } = await apiClient.get<MonthlyTrendItem[]>(
    `${STATISTICS_PATH}/monthly-trend?${query.toString()}`,
  );
  return data;
};

/** Get category breakdown (pie chart data) */
export const fetchCategoryBreakdown = async (
  params: CategoryBreakdownParams,
): Promise<CategoryBreakdownItem[]> => {
  const query = new URLSearchParams(
    params as unknown as Record<string, string>,
  ).toString();
  const { data } = await apiClient.get<CategoryBreakdownItem[]>(
    `${STATISTICS_PATH}/category-breakdown?${query}`,
  );
  return data;
};
