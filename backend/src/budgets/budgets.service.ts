import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface BudgetRecord {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategoryStatus {
  category: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'safe' | 'warning' | 'over';
}

export interface BudgetAlert {
  category: string;
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
   * 获取用户某月所有预算记录
   */
  async getBudgets(userId: string, month: string): Promise<BudgetRecord[]> {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month);

    if (error) {
      throw new InternalServerErrorException(`获取预算失败: ${error.message}`);
    }
    return data || [];
  }

  /**
   * 批量保存预算（upsert 语义）
   * 如果 user_id + category + month 已存在则更新 amount，否则插入
   */
  async upsertBudgets(userId: string, dto: UpsertBudgetDto): Promise<BudgetRecord[]> {
    const supabase = this.supabaseService.getClient();
    const results: BudgetRecord[] = [];

    for (const entry of dto.budgets) {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            user_id: userId,
            category: entry.category,
            amount: entry.amount,
            month: dto.month,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,category,month' },
        )
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(`保存预算失败: ${error.message}`);
      }
      if (data) {
        results.push(data as BudgetRecord);
      }
    }

    return results;
  }

  /**
   * 获取预算执行状态
   * 同时被 Budgets 页面和 Dashboard 使用
   */
  async getStatus(userId: string, month: string): Promise<BudgetStatus> {
    // 1. 获取该月所有预算
    const budgets = await this.getBudgets(userId, month);

    // 2. 计算已花费：从 transactions 表按 category + 月份汇总
    const spentMap = await this.calculateSpent(userId, month);

    // 3. 逐分类计算进度
    const categories: BudgetCategoryStatus[] = budgets.map((b) => {
      const spent = spentMap.get(b.category) || 0;
      const progress = b.amount > 0 ? Math.round((spent / b.amount) * 1000) / 10 : 0;
      const status: 'safe' | 'warning' | 'over' =
        progress >= 100 ? 'over' : progress >= 80 ? 'warning' : 'safe';
      return { category: b.category, budget: b.amount, spent, progress, status };
    });

    // 4. 聚合计算
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const remaining = totalBudget - totalSpent;
    const overallProgress =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

    // 5. 预警列表（超支 + 接近超支），按进度从高到低排序
    const alerts: BudgetAlert[] = categories
      .filter((c) => c.status !== 'safe')
      .map((c) => ({
        category: c.category,
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
  async copyFromPrevious(userId: string, targetMonth: string): Promise<BudgetRecord[]> {
    // 1. 计算上月月份
    const [y, m] = targetMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1); // JS month 0-indexed, m-2 = 上个月
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;

    // 2. 获取上月预算
    const prevBudgets = await this.getBudgets(userId, prevMonth);
    if (prevBudgets.length === 0) {
      return []; // 上月无预算，返回空数组
    }

    // 3. 批量 upsert 到目标月份
    const dto: UpsertBudgetDto = {
      month: targetMonth,
      budgets: prevBudgets.map((b) => ({ category: b.category, amount: b.amount })),
    };
    return this.upsertBudgets(userId, dto);
  }

  /**
   * 按分类 + 自然月汇总已花费金额
   * month 格式 "YYYY-MM-01"
   */
  private async calculateSpent(userId: string, month: string): Promise<Map<string, number>> {
    const supabase = this.supabaseService.getClient();
    const [y, m] = month.split('-').map(Number);

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate);

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
