/**
 * Annual Report API
 * 对齐后端 ReportsController: GET /reports/annual
 */
import { apiGet } from "./api";

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
 * GET /reports/annual?year=YYYY&book_id=xxx
 */
export const fetchAnnualReport = async (
  year: number,
  bookId?: string,
): Promise<AnnualReportData> => {
  const params = [`year=${encodeURIComponent(String(year))}`];
  if (bookId) {
    params.push(`book_id=${encodeURIComponent(bookId)}`);
  }
  const query = params.join("&");
  return apiGet<AnnualReportData>(`/reports/annual?${query}`, { requiresAuth: true });
};
