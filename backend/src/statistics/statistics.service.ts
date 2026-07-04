import { Injectable, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MemberComparisonQueryDto } from './dto/member-comparison.dto';

/** Internal transaction shape from the transactions table. */
interface Transaction {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  user_id?: string;
  book_id?: string;
}

/** Return type for GET /api/statistics/summary. */
export interface SummaryResult {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
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
  income: number;
  expense: number;
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

/** Return type for a single category entry in member comparison. */
export interface MemberCategoryItem {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

/** Return type for a single member in GET /api/statistics/member-comparison. */
export interface MemberComparisonItem {
  user_id: string;
  user_name: string;
  total_expense: number;
  categories: MemberCategoryItem[];
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
      .from('jj_transactions')
      .select('id, amount, date, type, category, user_id, book_id')
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
   * Aggregate a list of transactions into totalIncome / totalExpense / counts.
   */
  private aggregate(transactions: Transaction[]): {
    totalIncome: number;
    totalExpense: number;
    incomeCount: number;
    expenseCount: number;
  } {
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
        incomeCount += 1;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
        expenseCount += 1;
      }
    }
    return { totalIncome, totalExpense, incomeCount, expenseCount };
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
    // T-L2: 使用 Math.abs 确保基准值非零，但文档化预期行为
    const balanceChangePercent =
      prevBalance === 0
        ? null
        : Math.round((balanceChange / Math.abs(prevBalance)) * 1000) / 10;

    return {
      totalIncome: cur.totalIncome,
      totalExpense: cur.totalExpense,
      balance,
      incomeCount: cur.incomeCount,
      expenseCount: cur.expenseCount,
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
   * max 24).  Missing months are filled with 0.
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

    // Query all transactions (both income and expense)
    const allTransactions = await this.queryTransactions(
      userId,
      startDateStr,
      endDateStr,
      undefined, // no type filter - get both
      bookId,
    );

    // Group by YYYY-MM and type
    const monthMap: Record<string, { income: number; expense: number }> = {};
    for (const t of allTransactions) {
      const key = t.date.slice(0, 7);
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthMap[key].income += t.amount;
      } else if (t.type === 'expense') {
        monthMap[key].expense += t.amount;
      }
    }

    // Build ordered result, filling missing months with 0
    const result: MonthlyTrendItem[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(refEnd.getFullYear(), refEnd.getMonth() - i, 1);
      const key = this.toYearMonth(d);
      const data = monthMap[key] || { income: 0, expense: 0 };
      result.push({
        month: key,
        amount: type === 'income' ? data.income : data.expense,
        income: data.income,
        expense: data.expense,
      });
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
    const categoryInfoMap = await this.supabaseService.loadCategoryInfo(categoryIds);

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

  /**
   * GET /api/statistics/member-comparison
   *
   * 多成员消费对比：在指定月份范围内，按 user_id + category 分组聚合支出数据，
   * 返回每个成员的总额及各分类明细（含分类名称、图标、占比）。
   *
   * @param userId  当前用户 ID
   * @param bookId  当前账本 ID（从 current_book_id 自动获取）
   * @param dto     包含 month_from, month_to
   */
  async getMemberComparison(
    userId: string,
    bookId: string | undefined,
    dto: MemberComparisonQueryDto,
  ): Promise<MemberComparisonItem[]> {
    const supabase = this.supabaseService.getClient();

    if (!bookId) {
      throw new ForbiddenException('请先选择账本');
    }

    // 权限校验：确认当前用户是目标账本的成员
    const { data: membership } = await supabase
      .from('jj_book_members')
      .select('id')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      throw new ForbiddenException('无权访问该账本');
    }

    // 日期转换: "2026-05" → "2026-05-01", "2026-07" → "2026-08-01" (左闭右开，含7月全月)
    const [fy, fm] = dto.month_from.split('-').map(Number);
    const [ty, tm] = dto.month_to.split('-').map(Number);
    const startDate = `${String(fy).padStart(4, '0')}-${String(fm).padStart(2, '0')}-01`;
    // endDate 为 month_to 的下一个月第一天（左闭右开）
    const endMonth = new Date(ty, tm, 1); // tm is 1-indexed, so this gives the next month's 1st
    const endDate = endMonth.toISOString().slice(0, 10);

    // 1. 查询指定账本下的所有支出交易
    const { data: transactions, error } = await supabase
      .from('jj_transactions')
      .select('*')
      .eq('book_id', bookId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lt('date', endDate);

    if (error) {
      throw new InternalServerErrorException(
        `查询成员对比数据失败: ${error.message}`,
      );
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // 2. 按 user_id + category 分组聚合
    const userMap: Record<string, { total: number; categories: Record<string, number> }> = {};
    for (const t of transactions) {
      const uid = t.user_id;
      if (!uid) continue;
      if (!userMap[uid]) {
        userMap[uid] = { total: 0, categories: {} };
      }
      userMap[uid].total += t.amount;
      const cat = t.category || 'uncategorized';
      userMap[uid].categories[cat] = (userMap[uid].categories[cat] || 0) + t.amount;
    }

    // 3. 收集所有涉及的 user_id 和 category_id
    const allUserIds = Object.keys(userMap);
    const allCategoryIds = new Set<string>();
    for (const uid of allUserIds) {
      for (const catId of Object.keys(userMap[uid].categories)) {
        allCategoryIds.add(catId);
      }
    }

    // 4. 批量查询 users 表获取 user_name
    const userNames = await this.loadUserNames(allUserIds);

    // 5. 批量查询 categories 表获取 category_name / icon
    const categoryInfoMap = await this.supabaseService.loadCategoryInfo([...allCategoryIds]);

    // 6. 组装返回格式
    const result: MemberComparisonItem[] = [];
    for (const uid of allUserIds) {
      const userData = userMap[uid];
      const categories: MemberCategoryItem[] = [];
      const catEntries = Object.entries(userData.categories).sort(
        (a, b) => b[1] - a[1],
      );

      for (const [catId, amount] of catEntries) {
        const info = categoryInfoMap.get(catId);
        categories.push({
          category_name: catId === 'uncategorized' ? '未分类' : (info?.name || '未知'),
          category_icon: catId === 'uncategorized' ? '📌' : (info?.icon || '📌'),
          amount,
          percentage:
            userData.total === 0
              ? 0
              : Math.round((amount / userData.total) * 1000) / 10,
        });
      }

      result.push({
        user_id: uid,
        user_name: userNames.get(uid) || '未知用户',
        total_expense: userData.total,
        categories,
      });
    }

    // 按 total_expense 降序排列
    result.sort((a, b) => b.total_expense - a.total_expense);

    return result;
  }

  /** Load user names for a list of user UUIDs */
  private async loadUserNames(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('jj_users')
      .select('id, username')
      .in('id', userIds);

    const map = new Map<string, string>();
    (data || []).forEach((u: any) => {
      map.set(u.id, u.username || '未知用户');
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
