/**
 * Taro app — TypeScript type definitions
 * Shared interfaces for the family bookkeeping Taro app.
 */

// ---- User / Auth ----

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

// ---- Book / Ledger ----

export interface Book {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// ---- Transaction ----

export interface Transaction {
  id: number;
  amount: number;
  category: string; // category ID (UUID)
  type: "income" | "expense";
  date: string; // ISO date string
  description?: string;
  brand?: string;
  image_urls?: string;
  image_url_list?: string[];
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
}

export interface TransactionFilters {
  type?: "income" | "expense";
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "amount" | "date";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface CreateTransactionInput {
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
  description?: string;
  brand?: string;
  image_urls?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Category ----

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: "expense" | "income";
  sort_order: number;
  is_default?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  type: "expense" | "income";
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  sort_order?: number;
}

// ---- Statistics ----

export interface StatisticsSummary {
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

export interface MonthlyTrendItem {
  month: string; // "2025-01"
  amount: number;
}

export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

export interface SummaryParams {
  startDate: string;
  endDate: string;
}

export interface MonthlyTrendParams {
  months?: number;
  endDate?: string;
  type?: "income" | "expense";
}

export interface CategoryBreakdownParams {
  startDate: string;
  endDate: string;
  type: "income" | "expense";
}

// ---- Budget ----

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
  category_id: string;
  category_name: string;
  category_icon: string;
  budget: number;
  spent: number;
  progress: number;
  status: "safe" | "warning" | "over";
}

export interface BudgetStatus {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  overallProgress: number;
  categories: BudgetCategoryStatus[];
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  category_id: string;
  category_name: string;
  category_icon: string;
  budget: number;
  spent: number;
  progress: number;
}

export interface UpsertBudgetInput {
  month: string;
  budgets: { category: string; amount: number }[];
}

export interface CopyBudgetInput {
  targetMonth: string;
}

// ---- API Envelope ----

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  success?: false;
  message?: string;
  statusCode?: number;
  code?: string;
}

// ---- Location ----

export interface LocationInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
  poiId?: string | null;
}
