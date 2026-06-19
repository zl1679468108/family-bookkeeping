/**
 * Statistics API service.
 * 对齐 PC 端 frontend/src/services/statisticsApi.ts
 */
import { apiGet } from "./api";
import type {
  StatisticsSummary,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  YoYComparisonItem,
  YoYComparisonParams,
  DailySummaryItem,
  DailySummaryParams,
  MemberComparisonItem,
  MemberComparisonParams,
  SummaryParams,
  MonthlyTrendParams,
  CategoryBreakdownParams,
} from "../types";

const STATISTICS_PATH = "/statistics";

/** Get statistics summary for a date range */
export const fetchSummary = async (
  params: SummaryParams,
): Promise<StatisticsSummary> => {
  const parts = [
    `startDate=${encodeURIComponent(params.startDate)}`,
    `endDate=${encodeURIComponent(params.endDate)}`,
  ];
  const query = parts.join("&");
  return apiGet<StatisticsSummary>(`${STATISTICS_PATH}/summary?${query}`, { requiresAuth: true });
};

/** Get monthly trend data */
export const fetchMonthlyTrend = async (
  params: MonthlyTrendParams,
): Promise<MonthlyTrendItem[]> => {
  const parts: string[] = [];
  if (params.months)
    parts.push(`months=${encodeURIComponent(String(params.months))}`);
  if (params.endDate)
    parts.push(`endDate=${encodeURIComponent(params.endDate)}`);
  if (params.type) parts.push(`type=${encodeURIComponent(params.type)}`);
  const query = parts.join("&");
  return apiGet<MonthlyTrendItem[]>(
    `${STATISTICS_PATH}/monthly-trend${query ? "?" + query : ""}`,
    { requiresAuth: true },
  );
};

/** Get daily summary for calendar view */
export const fetchDailySummary = async (
  params: DailySummaryParams,
): Promise<DailySummaryItem[]> => {
  return apiGet<DailySummaryItem[]>(
    `${STATISTICS_PATH}/daily-summary?month=${encodeURIComponent(params.month)}`,
    { requiresAuth: true },
  );
};

/** Get category breakdown (pie chart data) */
export const fetchCategoryBreakdown = async (
  params: CategoryBreakdownParams,
): Promise<CategoryBreakdownItem[]> => {
  const parts = [
    `startDate=${encodeURIComponent(params.startDate)}`,
    `endDate=${encodeURIComponent(params.endDate)}`,
    `type=${encodeURIComponent(params.type)}`,
  ];
  const query = parts.join("&");
  return apiGet<CategoryBreakdownItem[]>(
    `${STATISTICS_PATH}/category-breakdown?${query}`,
    { requiresAuth: true },
  );
};

/** Get year-over-year comparison data */
export const fetchYearOverYear = async (
  params: YoYComparisonParams = {},
): Promise<YoYComparisonItem[]> => {
  const parts: string[] = [];
  if (params.year !== undefined)
    parts.push(`year=${encodeURIComponent(String(params.year))}`);
  if (params.compareYear !== undefined)
    parts.push(`compareYear=${encodeURIComponent(String(params.compareYear))}`);
  if (params.type)
    parts.push(`type=${encodeURIComponent(params.type)}`);
  const query = parts.join("&");
  return apiGet<YoYComparisonItem[]>(
    `${STATISTICS_PATH}/yoy-comparison${query ? "?" + query : ""}`,
    { requiresAuth: true },
  );
};

/** Get member comparison data for multi-member books */
export const fetchMemberComparison = async (
  params: MemberComparisonParams,
): Promise<MemberComparisonItem[]> => {
  const parts = [
    `book_id=${encodeURIComponent(params.book_id)}`,
    `month_from=${encodeURIComponent(params.month_from)}`,
    `month_to=${encodeURIComponent(params.month_to)}`,
  ];
  const query = parts.join("&");
  return apiGet<MemberComparisonItem[]>(
    `${STATISTICS_PATH}/member-comparison?${query}`,
    { requiresAuth: true },
  );
};
