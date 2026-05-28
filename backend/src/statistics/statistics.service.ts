import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/** Internal transaction shape from the transactions table. */
interface Transaction {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  image_url?: string;
  created_at: string;
  user_id?: string;
}

/** Return type for GET /api/statistics/summary. */
export interface SummaryResult {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeChange: number;
  incomeChangePercent: number | null;
  expenseChange: number;
  expenseChangePercent: number | null;
  balanceChange: number;
  balanceChangePercent: number | null;
}

/** Return type for a single month entry in GET /api/statistics/monthly-trend. */
export interface MonthlyTrendItem {
  month: string; // "YYYY-MM"
  amount: number;
}

/** Return type for a single category entry in GET /api/statistics/category-breakdown. */
export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

/** Return type for YoY comparison — single month pair. */
export interface YoYComparisonItem {
  month: string;      // "01", "02", … "12"
  monthLabel: string; // "1月", "2月", …
  currentYear: number;
  lastYear: number;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Query all transactions for one user in a date range, optionally filtered by type.
   * Supabase JS SDK does not support GROUP BY / SUM, so we fetch all rows and
   * aggregate in JS.  Single-user monthly volume is well under 1 000 rows.
   */
  private async queryTransactions(
    userId: string,
    startDate: string,
    endDate: string,
    type?: 'income' | 'expense',
    bookId?: string,
  ): Promise<Transaction[]> {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (type) {
      query = query.eq('type', type);
    }

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `查询交易记录失败: ${error.message}`,
      );
    }

    return (data ?? []) as Transaction[];
  }

  /**
   * Subtract `n` months from a "YYYY-MM-DD" date string.  Returns the
   * corresponding "YYYY-MM-DD" string, clamping the day to the last valid day
   * of the target month (e.g. 2025-03-31 → 2025-02-28).
   */
  private subMonths(dateStr: string, n: number): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Navigate to the target month by constructing from year/month-day arithmetic
    const target = new Date(year, month - 1 - n, 1);
    // Last day of the target month
    const lastDay = new Date(
      target.getFullYear(),
      target.getMonth() + 1,
      0,
    ).getDate();
    const clampedDay = Math.min(day, lastDay);

    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(clampedDay).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Aggregate a list of transactions into totalIncome / totalExpense.
   */
  private aggregate(transactions: Transaction[]): {
    totalIncome: number;
    totalExpense: number;
  } {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
      }
    }
    return { totalIncome, totalExpense };
  }

  /**
   * Format a Date as "YYYY-MM".
   */
  private toYearMonth(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * GET /api/statistics/summary
   *
   * Returns income, expense, and balance for the requested date range together
   * with period-over-period changes relative to the previous period of equal
   * length (shifted back by one month from startDate).
   */
  async getSummary(
    userId: string,
    startDate: string,
    endDate: string,
    bookId?: string,
  ): Promise<SummaryResult> {
    const prevStartDate = this.subMonths(startDate, 1);
    const prevEndDate = this.subMonths(endDate, 1);

    const [currentTxs, prevTxs] = await Promise.all([
      this.queryTransactions(userId, startDate, endDate, undefined, bookId),
      this.queryTransactions(userId, prevStartDate, prevEndDate, undefined, bookId),
    ]);

    const cur = this.aggregate(currentTxs);
    const prev = this.aggregate(prevTxs);

    const balance = cur.totalIncome - cur.totalExpense;
    const prevBalance = prev.totalIncome - prev.totalExpense;

    const incomeChange = cur.totalIncome - prev.totalIncome;
    const incomeChangePercent =
      prev.totalIncome === 0
        ? null
        : Math.round((incomeChange / prev.totalIncome) * 1000) / 10;

    const expenseChange = cur.totalExpense - prev.totalExpense;
    const expenseChangePercent =
      prev.totalExpense === 0
        ? null
        : Math.round((expenseChange / prev.totalExpense) * 1000) / 10;

    const balanceChange = balance - prevBalance;
    const balanceChangePercent =
      prevBalance === 0
        ? null
        : Math.round((balanceChange / Math.abs(prevBalance)) * 1000) / 10;

    return {
      totalIncome: cur.totalIncome,
      totalExpense: cur.totalExpense,
      balance,
      incomeChange,
      incomeChangePercent,
      expenseChange,
      expenseChangePercent,
      balanceChange,
      balanceChangePercent,
    };
  }

  /**
   * GET /api/statistics/monthly-trend
   *
   * Returns monthly aggregated amounts for the last `months` months (default 6,
   * max 24).  Missing months are filled with amount: 0.
   */
  async getMonthlyTrend(
    userId: string,
    months: number = 6,
    type: 'income' | 'expense' = 'expense',
    bookId?: string,
  ): Promise<MonthlyTrendItem[]> {
    const now = new Date();
    // First day of the earliest month in the window
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const startDateStr = rangeStart.toISOString().slice(0, 10);
    const endDateStr = now.toISOString().slice(0, 10);

    const transactions = await this.queryTransactions(
      userId,
      startDateStr,
      endDateStr,
      type,
      bookId,
    );

    // Group by YYYY-MM
    const monthMap: Record<string, number> = {};
    for (const t of transactions) {
      const key = t.date.slice(0, 7);
      monthMap[key] = (monthMap[key] || 0) + t.amount;
    }

    // Build ordered result, filling missing months with 0
    const result: MonthlyTrendItem[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = this.toYearMonth(d);
      result.push({ month: key, amount: monthMap[key] || 0 });
    }

    return result;
  }

  /**
   * GET /api/statistics/category-breakdown
   *
   * Groups transactions by category, returns the top 7 categories plus an
   * "other" bucket for the rest.  Each entry includes amount and percentage
   * (0-100, rounded to 1 decimal place).
   */
  async getCategoryBreakdown(
    userId: string,
    startDate: string,
    endDate: string,
    type: 'income' | 'expense',
    bookId?: string,
  ): Promise<CategoryBreakdownItem[]> {
    const transactions = await this.queryTransactions(
      userId,
      startDate,
      endDate,
      type,
      bookId,
    );

    // Aggregate by category
    const catMap: Record<string, number> = {};
    for (const t of transactions) {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }

    // Sort descending by amount
    const entries = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

    // Top 7 + "other" if more than 7 categories
    let merged: { category: string; amount: number }[];
    if (entries.length <= 7) {
      merged = entries;
    } else {
      const top7 = entries.slice(0, 7);
      const otherAmount = entries
        .slice(7)
        .reduce((sum, e) => sum + e.amount, 0);
      merged = [...top7, { category: 'other', amount: otherAmount }];
    }

    // Attach percentages
    return merged.map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage:
        totalAmount === 0
          ? 0
          : Math.round((item.amount / totalAmount) * 1000) / 10,
    }));
  }

  /**
   * GET /api/statistics/yoy-comparison
   *
   * Returns monthly amounts for the given year and the previous year,
   * for side-by-side bar chart comparison.
   */
  async getYearOverYear(
    userId: string,
    year: number = new Date().getFullYear(),
    type: 'income' | 'expense' = 'expense',
    bookId?: string,
  ): Promise<YoYComparisonItem[]> {
    const currentStart = `${year}-01-01`;
    const currentEnd = `${year}-12-31`;
    const lastStart = `${year - 1}-01-01`;
    const lastEnd = `${year - 1}-12-31`;

    const [currentTxs, lastTxs] = await Promise.all([
      this.queryTransactions(userId, currentStart, currentEnd, type, bookId),
      this.queryTransactions(userId, lastStart, lastEnd, type, bookId),
    ]);

    // Aggregate by month
    const aggregate = (txs: Transaction[]): number[] => {
      const months = new Array(12).fill(0);
      for (const t of txs) {
        const m = parseInt(t.date.slice(5, 7), 10) - 1; // 0-based
        if (m >= 0 && m < 12) {
          months[m] += t.amount;
        }
      }
      return months;
    };

    const curMonths = aggregate(currentTxs);
    const lastMonths = aggregate(lastTxs);

    return curMonths.map((cur, i) => ({
      month: String(i + 1).padStart(2, '0'),
      monthLabel: `${i + 1}月`,
      currentYear: cur,
      lastYear: lastMonths[i],
    }));
  }
}
