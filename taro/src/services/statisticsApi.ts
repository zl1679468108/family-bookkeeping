/**
 * Statistics API service.
 */

import { apiGet } from "./api";
import type {
  StatisticsSummary,
  MonthlyTrendItem,
  CategoryBreakdownItem,
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
  return apiGet<StatisticsSummary>(`${STATISTICS_PATH}/summary?${query}`);
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
  );
};

/** Get daily summary for calendar view */
export const fetchDailySummary = async (
  month: string,
): Promise<
  Array<{
    date: string;
    total_expense: number;
    total_income: number;
    transaction_count: number;
  }>
> => {
  return apiGet(
    `${STATISTICS_PATH}/daily-summary?month=${encodeURIComponent(month)}`,
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
  );
};

// ---- Annual Report ----

export interface AnnualReportOverview {
  total_income: number;
  total_expense: number;
  balance: number;
  balance_rate: number;
}

export interface MonthlyTrendRecord {
  month: number;
  income: number;
  expense: number;
}

export interface CategoryRankItem {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

export interface RecordItem {
  amount?: number;
  description?: string;
  counterparty?: string;
  date?: string;
  count?: number;
}

export interface ReportRecords {
  max_expense: RecordItem | null;
  max_expense_day: RecordItem | null;
  max_expense_merchant: RecordItem | null;
}

export interface AnnualReportData {
  overview: AnnualReportOverview;
  monthly: MonthlyTrendRecord[];
  top_categories: CategoryRankItem[];
  records: ReportRecords;
  record_count?: number;
}

/**
 * 获取年度报告数据
 * GET /reports/annual?year=YYYY
 */
export const fetchAnnualReport = async (
  year: number,
): Promise<AnnualReportData> => {
  const params = [`year=${encodeURIComponent(String(year))}`];
  const query = params.join("&");
  return apiGet<AnnualReportData>(`/reports/annual?${query}`);
};
