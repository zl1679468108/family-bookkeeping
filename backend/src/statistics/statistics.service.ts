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
  category_id: string;
  category_name: string;
  category_icon: string;
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

/** Return type for GET /api/statistics/daily-summary — single day entry. */
export interface DailySummaryItem {
  date: string;           // "YYYY-MM-DD"
  total_income: number;
  total_expense: number;
  transaction_count: number;
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

    // DEBUG: 日志输出以排查计数差异
    console.log('[queryTransactions] Filters:', JSON.stringify({
      userId,
      startDate,
      endDate,
      type,
      bookId,
    }));
    console.log('[queryTransactions] Returned rows:', data?.length);

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
    endDate?: string,
  ): Promise<MonthlyTrendItem[]> {
    const referenceDate = endDate
      ? new Date(endDate)
      : new Date();
    // Set to the last day of that month to include the full month
    const refEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    const endDateStr = refEnd.toISOString().slice(0, 10);
    const rangeStart = new Date(refEnd.getFullYear(), refEnd.getMonth() - (months - 1), 1);
    const startDateStr = rangeStart.toISOString().slice(0, 10);

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
      const d = new Date(refEnd.getFullYear(), refEnd.getMonth() - i, 1);
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

    // Aggregate by category UUID
    const catMap: Record<string, number> = {};
    for (const t of transactions) {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }

    // Sort descending by amount
    const entries = Object.entries(catMap)
      .map(([categoryId, amount]) => ({ categoryId, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Fetch category names/icons for the involved category IDs
    const categoryIds = entries.map((e) => e.categoryId);
    const categoryInfoMap = await this.loadCategoryInfo(categoryIds);

    const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

    // Top 7 + "other" if more than 7 categories
    let merged: { categoryId: string; amount: number }[];
    if (entries.length <= 7) {
      merged = entries;
    } else {
      const top7 = entries.slice(0, 7);
      const otherAmount = entries
        .slice(7)
        .reduce((sum, e) => sum + e.amount, 0);
      merged = [...top7, { categoryId: 'other', amount: otherAmount }];
    }

    return merged.map((item) => {
      const info = categoryInfoMap.get(item.categoryId);
      return {
        category_id: item.categoryId === 'other' ? 'other' : item.categoryId,
        category_name: item.categoryId === 'other' ? '其他' : (info?.name || '未知'),
        category_icon: item.categoryId === 'other' ? '📌' : (info?.icon || '📌'),
        amount: item.amount,
        percentage:
          totalAmount === 0
            ? 0
            : Math.round((item.amount / totalAmount) * 1000) / 10,
      };
    });
  }

  /** Load category name + icon for a list of category UUIDs */
  private async loadCategoryInfo(categoryIds: string[]): Promise<Map<string, { name: string; icon: string }>> {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('categories')
      .select('id, name, icon')
      .in('id', categoryIds);

    const map = new Map<string, { name: string; icon: string }>();
    (data || []).forEach((c: any) => {
      map.set(c.id, { name: c.name, icon: c.icon });
    });
    return map;
  }

  /**
   * GET /api/statistics/yoy-comparison
   *
   * Returns monthly amounts for two years side-by-side.
   * Default: current year vs previous year.
   */
  async getYearOverYear(
    userId: string,
    year: number = new Date().getFullYear(),
    type: 'income' | 'expense' = 'expense',
    bookId?: string,
    compareYear?: number,
  ): Promise<YoYComparisonItem[]> {
    const actualCompareYear = compareYear ?? year - 1;
    const yearAStart = `${year}-01-01`;
    const yearAEnd = `${year}-12-31`;
    const yearBStart = `${actualCompareYear}-01-01`;
    const yearBEnd = `${actualCompareYear}-12-31`;

    const [yearATxs, yearBTxs] = await Promise.all([
      this.queryTransactions(userId, yearAStart, yearAEnd, type, bookId),
      this.queryTransactions(userId, yearBStart, yearBEnd, type, bookId),
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

    const yearAMonths = aggregate(yearATxs);
    const yearBMonths = aggregate(yearBTxs);

    return yearAMonths.map((cur, i) => ({
      month: String(i + 1).padStart(2, '0'),
      monthLabel: `${i + 1}月`,
      currentYear: cur,
      lastYear: yearBMonths[i],
    }));
  }

  /**
   * GET /api/statistics/daily-summary
   *
   * Returns daily aggregated income/expense/count for every day in the given
   * month.  Days without any transactions are included with zero values.
   *
   * @param userId   Authenticated user ID
   * @param month    Month string in "YYYY-MM" format (e.g., "2026-05")
   * @param bookId   Optional book ID to scope the query
   */
  async getDailySummary(
    userId: string,
    month: string,
    bookId?: string,
  ): Promise<DailySummaryItem[]> {
    // Parse month into start and end dates
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const mon = parseInt(monthStr, 10);

    // First day of the month
    const startDate = `${yearStr}-${monthStr}-01`;

    // Last day of the month
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    // Fetch all transactions for this user in this month
    const transactions = await this.queryTransactions(
      userId,
      startDate,
      endDate,
      undefined,
      bookId,
    );

    // Aggregate by date (YYYY-MM-DD)
    const dateMap: Record<string, { income: number; expense: number; count: number }> = {};
    for (const t of transactions) {
      const dateKey = t.date.slice(0, 10); // "YYYY-MM-DD"
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { income: 0, expense: 0, count: 0 };
      }
      if (t.type === 'income') {
        dateMap[dateKey].income += t.amount;
      } else if (t.type === 'expense') {
        dateMap[dateKey].expense += t.amount;
      }
      dateMap[dateKey].count += 1;
    }

    // Build ordered result for every day of the month, filling gaps with zeros
    const result: DailySummaryItem[] = [];
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
      const agg = dateMap[dateStr];
      result.push({
        date: dateStr,
        total_income: agg ? Math.round(agg.income * 100) / 100 : 0,
        total_expense: agg ? Math.round(agg.expense * 100) / 100 : 0,
        transaction_count: agg ? agg.count : 0,
      });
    }

    return result;
  }
}
