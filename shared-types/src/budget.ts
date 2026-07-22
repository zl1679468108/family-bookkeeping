/* ========== Budget ========== */
export interface BudgetRecord {
  id: string
  user_id: string
  category: string
  book_id?: string
  amount: number
  month: string
  created_at: string
  updated_at: string
}

export interface BudgetCategoryStatus {
  category_id: string
  category_name: string
  category_icon: string
  budget: number
  spent: number
  progress: number
  status: 'safe' | 'warning' | 'over'
}

export interface BudgetAlert {
  category_id: string
  category_name: string
  category_icon: string
  budget: number
  spent: number
  progress: number
}

export interface BudgetStatus {
  totalBudget: number
  totalSpent: number
  remaining: number
  overallProgress: number
  categories: BudgetCategoryStatus[]
  alerts: BudgetAlert[]
}

export interface UpsertBudgetInput {
  month: string
  budgets: { category: string; amount: number }[]
}

export interface CopyBudgetInput {
  targetMonth: string
}
