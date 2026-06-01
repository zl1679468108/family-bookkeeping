/** 预算记录 */
export interface BudgetRecord {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

/** 预算分类执行状态 */
export interface CategoryBudgetStatus {
  category_id: string;
  category_name: string;
  category_icon: string;
  budget: number;
  spent: number;
  progress: number;        // 0 ~ 100+
  status: 'safe' | 'warning' | 'over';
}

/** 预算预警项 */
export interface BudgetAlert {
  category_id: string;
  category_name: string;
  category_icon: string;
  budget: number;
  spent: number;
  progress: number;        // ≥90
}

/** 预算状态响应 */
export interface BudgetStatusResponse {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overallProgress: number;
  categories: CategoryBudgetStatus[];
  alerts: BudgetAlert[];
}

/** 批量保存预算输入 */
export interface UpsertBudgetInput {
  month: string;
  budgets: { category: string; amount: number }[];
}

/** 复制预算输入 */
export interface CopyBudgetInput {
  targetMonth: string;
}
