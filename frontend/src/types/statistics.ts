/**
 * Statistics 模块 - 前端类型定义
 */

/** 统计概览 - API 响应 */
export interface StatisticsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeChange: number;
  incomeChangePercent: number | null; // null 表示上月无数据
  expenseChange: number;
  expenseChangePercent: number | null;
  balanceChange: number;
  balanceChangePercent: number | null;
}

/** 月度趋势 - 单条数据 */
export interface MonthlyTrendItem {
  month: string; // "2025-01"
  amount: number;
}

/** 分类占比 - 单条数据 */
export interface CategoryBreakdownItem {
  category: string; // category key, e.g. "food", "other"
  amount: number;
  percentage: number; // 0-100
}

/** 概览请求参数 */
export interface SummaryParams {
  startDate: string;
  endDate: string;
}

/** 月度趋势请求参数 */
export interface MonthlyTrendParams {
  months?: number;
  type?: 'income' | 'expense';
}

/** 分类占比请求参数 */
export interface CategoryBreakdownParams {
  startDate: string;
  endDate: string;
  type: 'income' | 'expense';
}

/** 年度对比 - 单条数据 */
export interface YoYComparisonItem {
  month: string;      // "01"
  monthLabel: string; // "1月"
  currentYear: number;
  lastYear: number;
}

/** 年度对比请求参数 */
export interface YoYComparisonParams {
  year?: number;
  type?: 'income' | 'expense';
}
