import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface Transaction {
  id: number;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  book_id?: string;
  user_id?: string;
}

interface OverviewData {
  total_income: number;
  total_expense: number;
  balance: number;
  balance_rate: number;
}

interface MonthlyData {
  month: number;
  income: number;
  expense: number;
}

interface CategoryRank {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

interface RecordData {
  max_expense: { amount: number; description: string; date: string } | null;
  max_expense_day: { date: string; count: number; amount: number } | null;
  max_expense_merchant: { counterparty: string; count: number; amount: number } | null;
}

interface BookBreakdown {
  book_id: string;
  book_name: string;
  amount: number;
  percentage: number;
}

interface MemberRank {
  user_id: string;
  nickname: string;
  expense: number;
  percentage: number;
}

interface FunFactData {
  dining_total: number;
  daily_avg_expense: number;
  max_continuous_days: number;
}

export interface AnnualReportResponse {
  overview: OverviewData;
  monthly: MonthlyData[];
  top_categories: CategoryRank[];
  records: RecordData;
  book_breakdown: BookBreakdown[];
  member_ranking: MemberRank[];
  fun_fact: FunFactData;
}

@Injectable()
export class ReportsService {
  constructor(private supabaseService: SupabaseService) {}

  async getAnnualReport(
    year: number,
    bookId: string | undefined,
    userId: string,
  ): Promise<AnnualReportResponse> {
    const supabase = this.supabaseService.getClient();

    // 确保 year 是数字类型
    const yearNum = Number(year);
    
    // 确定查询范围：用户的所有账本或指定账本
    let bookIds: string[] = [];

    if (bookId) {
      // 校验用户是否是该账本成员
      const { data: member } = await supabase
        .from('jj_book_members')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .single();

      if (!member) {
        throw new ForbiddenException('无权访问该账本的报告');
      }
      bookIds = [bookId];
    } else {
      // 获取用户所有账本
      const { data: members } = await supabase
        .from('jj_book_members')
        .select('book_id')
        .eq('user_id', userId);

      bookIds = (members || []).map((m: any) => m.book_id);
    }

    // 查询该年份范围内、属于用户账本的所有交易
    const startDate = `${yearNum}-01-01`;
    const endDate = `${yearNum}-12-31`;

    let query = supabase
      .from('jj_transactions')
      .select('id, amount, date, type, category, user_id, book_id, description, brand, location_name')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('user_id', userId);

    if (bookIds.length > 0) {
      query = query.in('book_id', bookIds);
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new InternalServerErrorException('获取交易数据失败: ' + error.message);
    }

    const txns = (transactions || []) as Transaction[];

    // 计算所有聚合指标
    const overview = this.computeOverview(txns);
    const monthly = this.computeMonthly(txns, year);
    const topCategories = await this.computeTopCategories(supabase, txns, userId);
    const records = this.computeRecords(txns);
    const bookBreakdown = await this.computeBookBreakdown(supabase, txns, bookIds);
    const memberRanking = await this.computeMemberRanking(supabase, txns, bookId);
    const funFact = await this.computeFunFact(supabase, txns, userId, year);

    return {
      overview,
      monthly,
      top_categories: topCategories,
      records,
      book_breakdown: bookBreakdown,
      member_ranking: memberRanking,
      fun_fact: funFact,
    };
  }

  private computeOverview(transactions: Transaction[]): OverviewData {
    const total_income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const total_expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = total_income - total_expense;
    const balance_rate = total_income > 0
      ? Math.round((balance / total_income) * 10000) / 100
      : 0;

    return {
      total_income: Math.round(total_income * 100) / 100,
      total_expense: Math.round(total_expense * 100) / 100,
      balance: Math.round(balance * 100) / 100,
      balance_rate,
    };
  }

  private computeMonthly(
    transactions: Transaction[],
    year: number,
  ): MonthlyData[] {
    const monthly: MonthlyData[] = [];

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${String(m).padStart(2, '0')}`;
      const monthTxns = transactions.filter((t) => t.date.startsWith(monthStr));

      const income = monthTxns
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTxns
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthly.push({
        month: m,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
      });
    }

    return monthly;
  }

  private async computeTopCategories(
    supabase: any,
    transactions: Transaction[],
    userId: string,
  ): Promise<CategoryRank[]> {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // 按分类 UUID 聚合
    const categoryMap = new Map<string, number>();
    expenses.forEach((t) => {
      if (t.category) {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + Number(t.amount));
      }
    });

    if (categoryMap.size === 0) return [];

    // 查询 categories 表获取真实名称和图标
    const categoryIds = Array.from(categoryMap.keys());
    const { data: categories } = await supabase
      .from('jj_categories')
      .select('id, name, icon')
      .in('id', categoryIds)
      .eq('user_id', userId);

    const nameMap = new Map<string, string>();
    const iconMap = new Map<string, string>();
    (categories || []).forEach((c: any) => {
      nameMap.set(c.id, c.name);
      iconMap.set(c.id, c.icon || '📦');
    });

    // 排序取 Top 5
    const sorted = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted.map(([categoryId, amount]) => ({
      category_name: nameMap.get(categoryId) || '未分类',
      category_icon: iconMap.get(categoryId) || '📦',
      amount: Math.round(amount * 100) / 100,
      percentage: totalExpense > 0
        ? Math.round((amount / totalExpense) * 10000) / 100
        : 0,
    }));
  }

  private computeRecords(transactions: Transaction[]): RecordData {
    const expenses = transactions.filter((t) => t.type === 'expense');

    // 最高单笔消费
    const maxExpense = expenses.length > 0
      ? expenses.reduce((max, t) =>
          Number(t.amount) > Number(max.amount) ? t : max,
        )
      : null;

    // 最多消费日
    const dayMap = new Map<string, { count: number; amount: number }>();
    expenses.forEach((t) => {
      const existing = dayMap.get(t.date) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += Number(t.amount);
      dayMap.set(t.date, existing);
    });

    const maxExpenseDay = dayMap.size > 0
      ? Array.from(dayMap.entries())
          .sort((a, b) => b[1].count - a[1].count)[0]
      : null;

    // 最多消费商户（用 description 近似）
    const merchantMap = new Map<string, { count: number; amount: number }>();
    expenses.forEach((t) => {
      const key = t.description || '未备注';
      const existing = merchantMap.get(key) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += Number(t.amount);
      merchantMap.set(key, existing);
    });

    const maxExpenseMerchant = merchantMap.size > 0
      ? Array.from(merchantMap.entries())
          .sort((a, b) => b[1].amount - a[1].amount)[0]
      : null;

    return {
      max_expense: maxExpense
        ? {
            amount: Math.round(Number(maxExpense.amount) * 100) / 100,
            description: maxExpense.description || '',
            date: maxExpense.date,
          }
        : null,
      max_expense_day: maxExpenseDay
        ? {
            date: maxExpenseDay[0],
            count: maxExpenseDay[1].count,
            amount: Math.round(maxExpenseDay[1].amount * 100) / 100,
          }
        : null,
      max_expense_merchant: maxExpenseMerchant
        ? {
            counterparty: maxExpenseMerchant[0],
            count: maxExpenseMerchant[1].count,
            amount: Math.round(maxExpenseMerchant[1].amount * 100) / 100,
          }
        : null,
    };
  }

  private async computeBookBreakdown(
    supabase: any,
    transactions: Transaction[],
    bookIds: string[],
  ): Promise<BookBreakdown[]> {
    if (bookIds.length <= 1) return [];

    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // 按账本分组
    const bookMap = new Map<string, number>();
    expenses.forEach((t) => {
      if (t.book_id) {
        bookMap.set(t.book_id, (bookMap.get(t.book_id) || 0) + Number(t.amount));
      }
    });

    // 获取账本名称
    const { data: books } = await supabase
      .from('jj_books')
      .select('id, name')
      .in('id', bookIds);

    const bookNameMap = new Map<string, string>();
    (books || []).forEach((b: any) => bookNameMap.set(b.id, b.name));

    const breakdown: BookBreakdown[] = [];
    bookMap.forEach((amount, bookId) => {
      breakdown.push({
        book_id: bookId,
        book_name: bookNameMap.get(bookId) || '未知账本',
        amount: Math.round(amount * 100) / 100,
        percentage: totalExpense > 0
          ? Math.round((amount / totalExpense) * 10000) / 100
          : 0,
      });
    });

    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  private async computeMemberRanking(
    supabase: any,
    transactions: Transaction[],
    bookId: string | undefined,
  ): Promise<MemberRank[]> {
    // 只有指定单个多成员账本时才返回成员排名
    if (!bookId) {
      // 未指定账本时，不显示成员排名
      return [];
    }

    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // 按成员分组
    const memberMap = new Map<string, number>();
    expenses.forEach((t) => {
      if (t.user_id) {
        memberMap.set(t.user_id, (memberMap.get(t.user_id) || 0) + Number(t.amount));
      }
    });

    // 只有多成员时才返回排名
    if (memberMap.size <= 1) return [];

    // 获取成员昵称（从 users 表）
    const userIds = Array.from(memberMap.keys());
    const { data: users } = await supabase
      .from('jj_users')
      .select('id, username')
      .in('id', userIds);

    const nickMap = new Map<string, string>();
    (users || []).forEach((u: any) => nickMap.set(u.id, u.username || '用户'));

    const ranking: MemberRank[] = [];
    memberMap.forEach((expense, userId) => {
      ranking.push({
        user_id: userId,
        nickname: nickMap.get(userId) || '用户',
        expense: Math.round(expense * 100) / 100,
        percentage: totalExpense > 0
          ? Math.round((expense / totalExpense) * 10000) / 100
          : 0,
      });
    });

    return ranking.sort((a, b) => b.expense - a.expense);
  }

  private async computeFunFact(
    supabase: any,
    transactions: Transaction[],
    userId: string,
    year: number,
  ): Promise<FunFactData> {
    const expenses = transactions.filter((t) => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // 查询分类表，找到"餐饮"类别的 UUID
    const { data: categories } = await supabase
      .from('jj_categories')
      .select('id, name')
      .eq('user_id', userId);

    const diningCategoryIds = (categories || [])
      .filter((c: any) => c.name.includes('餐饮'))
      .map((c: any) => c.id);

    // 餐饮总额（按 UUID 匹配）
    const diningTotal = expenses
      .filter((t) => t.category && diningCategoryIds.includes(t.category))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 日均支出
    const dailyAvg = totalExpense / 365;

    // 最长连续记账天数
    const dates = Array.from(
      new Set(transactions.map((t) => t.date)),
    ).sort();

    let maxContinuous = 0;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxContinuous = Math.max(maxContinuous, currentStreak);
        currentStreak = 1;
      }
    }
    maxContinuous = Math.max(maxContinuous, currentStreak);

    return {
      dining_total: Math.round(diningTotal * 100) / 100,
      daily_avg_expense: Math.round(dailyAvg * 100) / 100,
      max_continuous_days: maxContinuous,
    };
  }
}
