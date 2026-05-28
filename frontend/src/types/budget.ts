/**
 * Budget 模块 - 前端类型定义
 */

/** 预算记录 */
export interface BudgetRecord {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string; // "YYYY-MM-01"
  created_at: string;
  updated_at: string;
}

/** 单分类预算状态 */
export interface BudgetCategoryStatus {
  category: string;
  budget: number;
  spent: number;
  progress: number; // 0-100+
  status: 'safe' | 'warning' | 'over';
}

/** 预算预警项 */
export interface BudgetAlert {
  category: string;
  budget: number;
  spent: number;
  progress: number;
}

/** 预算执行状态（GET /budgets/status） */
export interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overallProgress: number;
  categories: BudgetCategoryStatus[];
  alerts: BudgetAlert[];
}

/** 设置预算请求体 */
export interface UpsertBudgetInput {
  month: string;
  budgets: { category: string; amount: number }[];
}

/** 复制预算请求体 */
export interface CopyBudgetInput {
  targetMonth: string;
}
