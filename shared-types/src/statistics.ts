/* ========== Statistics ========== */
export interface StatisticsSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  incomeCount?: number
  expenseCount?: number
  incomeChange: number
  incomeChangePercent: number | null
  expenseChange: number
  expenseChangePercent: number | null
  balanceChange: number
  balanceChangePercent: number | null
}

export interface MonthlyTrendItem {
  month: string
  amount: number
  income?: number
  expense?: number
}

export interface CategoryBreakdownItem {
  category_id: string
  category_name: string
  category_icon: string
  amount: number
  percentage: number
}

export interface SummaryParams {
  startDate: string
  endDate: string
}

export interface MonthlyTrendParams {
  months?: number
  endDate?: string
  type?: 'income' | 'expense'
}

export interface CategoryBreakdownParams {
  startDate: string
  endDate: string
  type: 'income' | 'expense'
}

export interface YoYComparisonItem {
  month: string
  monthLabel: string
  currentYear: number
  lastYear: number
}

export interface YoYComparisonParams {
  year?: number
  compareYear?: number
  type?: 'income' | 'expense'
}

export interface DailySummaryItem {
  date: string
  total_income: number
  total_expense: number
  transaction_count: number
}

export interface DailySummaryParams {
  month: string
}
