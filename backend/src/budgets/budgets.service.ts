import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface BudgetRecord {
  id: string;
  user_id: string;
  category: string;
  book_id?: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategoryStatus {
  category_id: string;
  category_name: string;
  category_icon: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'safe' | 'warning' | 'over';
}

export interface BudgetAlert {
  category_id: string;
  category_name: string;
  category_icon: string;
  budget: number;
  spent: number;
  progress: number;
}

export interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overallProgress: number;
  categories: BudgetCategoryStatus[];
  alerts: BudgetAlert[];
}

export interface UpsertBudgetDto {
  month: string;
  budgets: { category: string; amount: number }[];
}

@Injectable()
export class BudgetsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 归一化月份字符串，统一转为 "YYYY-MM-01" 格式
   * 兼容前端传入的 "YYYY-MM"、"YYYY-MM-DD"、"YYYY-MM-01" 等格式
   */
  private normalizeMonth(month: string): string {
    const parts = month.split('-');
    const y = parts[0];
    const m = (parts[1] || '01').padStart(2, '0');
    return `${y}-${m}-01`;
  }

  /**
   * 获取用户某月所有预算记录
   */
  async getBudgets(userId: string, month: string, bookId?: string): Promise<BudgetRecord[]> {
    const supabase = this.supabaseService.getClient();
    const normalizedMonth = this.normalizeMonth(month);
    let query = supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', normalizedMonth);

    if (bookId) query = query.eq('book_id', bookId);

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(`获取预算失败: ${error.message}`);
    }
    return data || [];
  }

  /**
   * 批量保存预算（upsert 语义）
   * 如果 user_id + category + month 已存在则更新 amount，否则插入
   */
  async upsertBudgets(userId: string, bookId: string | undefined, dto: UpsertBudgetDto): Promise<BudgetRecord[]> {
    const supabase = this.supabaseService.getClient();

    const records = dto.budgets.map((entry) => ({
      user_id: userId,
      book_id: bookId || null,
      category: entry.category,
      amount: entry.amount,
      month: dto.month,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('budgets')
      .upsert(records, { onConflict: 'user_id,book_id,category,month' })
      .select();

    if (error) {
      throw new InternalServerErrorException(`保存预算失败: ${error.message}`);
    }

    return (data || []) as BudgetRecord[];
  }

  /**
   * 获取预算执行状态
   * 同时被 Budgets 页面和 Dashboard 使用
   * categories 同时覆盖“已设置预算”和“已有花费”的支出分类
   */
  async getStatus(userId: string, month: string, bookId?: string): Promise<BudgetStatus> {
    // 1. 获取该月所有预算
    const budgets = await this.getBudgets(userId, month, bookId);

    // 2. 计算已花费：从 transactions 表按 category + 月份汇总
    const spentMap = await this.calculateSpent(userId, month, bookId);

    // 3. 收集需要展示的分类 ID：
    //    - 已设置预算的分类 (budgets)
    //    - 本月已有花费的分类 (spentMap)
    const categoryIdsFromBudgets = budgets.map((b) => b.category);
    const categoryIdsFromSpent = [...spentMap.keys()];
    const categoryIds = [...new Set([...categoryIdsFromBudgets, ...categoryIdsFromSpent])];

    // 4. 获取所有涉及的分类信息
    const categoryInfoMap = await this.supabaseService.loadCategoryInfo(categoryIds);

    // 5. 构造 budget 查找表（category -> amount）
    const budgetAmountMap = new Map<string, number>();
    budgets.forEach((b) => budgetAmountMap.set(b.category, b.amount));

    // 6. 逐分类计算进度
    const categories: BudgetCategoryStatus[] = categoryIds.map((catId) => {
      const budget = budgetAmountMap.get(catId) || 0;
      const spent = spentMap.get(catId) || 0;
      const progress = budget > 0 ? Math.round((spent / budget) * 1000) / 10 : 0;
      const status: 'safe' | 'warning' | 'over' =
        progress >= 100 ? 'over' : progress >= 80 ? 'warning' : 'safe';
      const info = categoryInfoMap.get(catId);
      return {
        category_id: catId,
        category_name: info?.name || '未知',
        category_icon: info?.icon || '📌',
        budget, spent, progress, status,
      };
    });

    // 7. 聚合计算
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const remaining = totalBudget - totalSpent;
    const overallProgress =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

    // 8. 预警列表（超支 + 接近超支），按进度从高到低排序
    const alerts: BudgetAlert[] = categories
      .filter((c) => c.status !== 'safe' && c.budget > 0)
      .map((c) => ({
        category_id: c.category_id,
        category_name: c.category_name,
        category_icon: c.category_icon,
        budget: c.budget,
        spent: c.spent,
        progress: c.progress,
      }))
      .sort((a, b) => b.progress - a.progress);

    return { totalBudget, totalSpent, remaining, overallProgress, categories, alerts };
  }

  /**
   * 复制上月预算到指定月份
   */
  async copyFromPrevious(userId: string, targetMonth: string, bookId?: string): Promise<BudgetRecord[]> {
    // 1. 计算上月月份
    const [y, m] = targetMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1); // JS month 0-indexed, m-2 = 上个月
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;

    // 2. 获取上月预算
    const prevBudgets = await this.getBudgets(userId, prevMonth, bookId);
    if (prevBudgets.length === 0) {
      return []; // 上月无预算，返回空数组
    }

    // 3. 批量 upsert 到目标月份
    const dto: UpsertBudgetDto = {
      month: targetMonth,
      budgets: prevBudgets.map((b) => ({ category: b.category, amount: b.amount })),
    };
    return this.upsertBudgets(userId, bookId, dto);
  }

  /**
   * 按分类 + 自然月汇总已花费金额
   * 兼容 "YYYY-MM" / "YYYY-MM-DD" / "YYYY-MM-01" 等格式
   */
  private async calculateSpent(userId: string, month: string, bookId?: string): Promise<Map<string, number>> {
    const supabase = this.supabaseService.getClient();
    const normalized = this.normalizeMonth(month);
    const [y, m] = normalized.split('-').map(Number);

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let query = supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

    if (bookId) query = query.eq('book_id', bookId);

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(`查询花费失败: ${error.message}`);
    }

    const map = new Map<string, number>();
    (data || []).forEach((row: { category: string; amount: number }) => {
      map.set(row.category, (map.get(row.category) || 0) + Number(row.amount));
    });
    return map;
  }
}
