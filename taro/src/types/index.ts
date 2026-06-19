/**
 * Taro app — TypeScript type definitions
 * Shared interfaces for the family bookkeeping Taro app.
 * Kept in sync with frontend/src/types/* (PC端) and backend DTOs.
 */

// ---- User / Auth ----

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  role?: "user" | "admin";
  status?: "active" | "suspended" | "deleted";
  current_book_id?: string;
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
  role?: string;
  icon?: string;
  description?: string;
}

// ---- Transaction ----

export interface Transaction {
  id: number;
  amount: number;
  category: string; // category ID (UUID)
  type: "income" | "expense";
  date: string; // ISO date string
  time?: string;
  description?: string;
  brand?: string;
  image_urls?: string;
  image_url_list?: string[];
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  poi_id?: string | null;
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
  view?: "own" | "all";
  keyword?: string;
  min_amount?: number;
  max_amount?: number;
  date_from?: string;
  date_to?: string;
  bookId?: string;
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

// ---- Batch Operations ----

export type BatchOperation =
  | "update_category"
  | "update_type"
  | "update_date"
  | "move_book"
  | "delete";

export interface BatchPayload {
  category_id?: string;
  type?: "income" | "expense";
  date?: string;
  book_id?: string;
}

export interface BatchRequest {
  ids: number[];
  operation: BatchOperation;
  payload?: BatchPayload;
}

export interface BatchResponse {
  affected: number;
}

// ---- Category ----

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: "expense" | "income";
  sort_order: number;
  is_default?: boolean;
  user_id?: string;
  icon_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  type: "expense" | "income";
  icon_id?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  sort_order?: number;
  icon_id?: string;
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
  incomeCount?: number;
  expenseCount?: number;
}

export interface MonthlyTrendItem {
  month: string; // "2025-01"
  amount: number;
  income?: number;
  expense?: number;
}

export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

export interface YoYComparisonItem {
  month: string; // "01"-"12"
  monthLabel: string; // "1月"-"12月"
  currentYear: number;
  lastYear: number;
}

export interface YoYComparisonParams {
  year?: number;
  compareYear?: number;
  type?: "income" | "expense";
}

export interface DailySummaryItem {
  date: string; // "YYYY-MM-DD"
  total_income: number;
  total_expense: number;
  transaction_count: number;
}

export interface DailySummaryParams {
  month: string; // "YYYY-MM"
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

// ---- Member Comparison ----

export interface MemberCategoryBreakdown {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

export interface MemberComparisonItem {
  user_id: string;
  user_name: string;
  total_expense: number;
  categories: MemberCategoryBreakdown[];
}

export interface MemberComparisonParams {
  book_id: string;
  month_from: string; // "YYYY-MM"
  month_to: string; // "YYYY-MM"
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

// ---- Template ----

export interface Template {
  id: string;
  user_id?: string;
  name: string;
  type: "expense" | "income";
  amount?: number;
  category_id?: string;
  category_name?: string;
  note?: string;
  description?: string;
  brand?: string;
  merchant_name?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string;
  book_id?: string;
  sort_order?: number;
  icon?: string;
  created_at?: string;
}

export interface CreateTemplateInput {
  name: string;
  type: "expense" | "income";
  amount?: number;
  category_id?: string;
  note?: string;
  merchant_name?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  poi_id?: string;
  book_id?: string;
  sort_order?: number;
}

export interface ExecuteTemplateInput {
  amount?: number;
}

export interface ReorderInput {
  ids: string[];
}

// ---- Map ----

export interface MapTransaction {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  poi_id: string | null;
  userId?: string;
  username?: string;
}

export interface MerchantSummary {
  poi_id: string | null;
  location_name: string;
  total_amount: number;
  transaction_count: number;
  last_transaction_date: string;
  expense_count: number;
  income_count: number;
  expense_total: number;
  income_total: number;
  last_expense_date: string | null;
  last_income_date: string | null;
  memberBreakdown?: MemberBreakdown[];
  latitude?: number;
  longitude?: number;
}

export interface MapFilters {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense";
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  memberIds?: string[];
}

export interface MapMember {
  userId: string;
  username: string;
  role: "owner" | "member";
  color: string;
}

export interface MemberLocation {
  userId: string;
  username: string;
  email: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  isSharing: boolean;
}

export interface MemberBreakdown {
  userId: string;
  username: string;
  expenseTotal: number;
  expenseCount: number;
}

// ---- Custom Icons ----

export interface CustomIcon {
  id: string;
  user_id: string;
  icon_url: string;
  icon_type: "category" | "book";
  created_at: string;
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
