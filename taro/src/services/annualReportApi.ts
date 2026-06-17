/**
 * Annual Report API
 */
import { apiGet } from "./api";

export interface AnnualReportData {
  total_income: number;
  total_expense: number;
  transaction_count: number;
  monthly: {
    [month: string]: {
      income: number;
      expense: number;
    };
  };
  expense_categories: Array<{
    id: string;
    name: string;
    icon: string;
    amount: number;
    count: number;
  }>;
  income_categories: Array<{
    id: string;
    name: string;
    icon: string;
    amount: number;
    count: number;
  }>;
  max_expense: number;
  max_income: number;
  busiest_month: number;
}

export const fetchAnnualReport = async (
  year: number
): Promise<AnnualReportData> => {
  return apiGet<AnnualReportData>(`/annual-report?year=${year}`, { requiresAuth: true });
};
