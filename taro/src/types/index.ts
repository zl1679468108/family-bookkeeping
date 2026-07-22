/**
 * Taro app — TypeScript type definitions
 *
 * 核心类型来自 @family-bookkeeping/shared-types（三端统一）。
 * 此文件仅补充 Taro 小程序特有的类型。
 */

export type {
  Template,
  CreateTemplateInput,
  ExecuteTemplateInput,
  ReorderInput,
  Book,
  BookMember,
  BookRole,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  BudgetRecord,
  BudgetCategoryStatus,
  BudgetStatus,
  BudgetAlert,
  UpsertBudgetInput,
  CopyBudgetInput,
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
  PaginatedResponse,
  BatchOperation,
  BatchPayload,
  BatchRequest,
  BatchResponse,
  StatisticsSummary,
  SummaryParams,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  CategoryBreakdownParams,
  YoYComparisonItem,
  YoYComparisonParams,
  DailySummaryItem,
  DailySummaryParams,
  MemberCategoryBreakdown,
  MemberComparisonItem,
  MemberComparisonParams,
  UserProfile,
  TokenPair,
  AuthResponse,
  ApiEnvelope,
  ApiErrorPayload,
  MapTransaction,
  MerchantSummary,
  MapFilters,
  LocationResult,
  MemberLocation,
  MapMember,
  MemberBreakdown,
  LocationUpdateRequest,
} from '@family-bookkeeping/shared-types'

// ---- Taro 特有类型 ----

/** 自定义图标 */
export interface CustomIcon {
  id: string
  user_id: string
  icon_url: string
  icon_type: 'category' | 'book' | 'avatar'
  created_at: string
}

/** 位置信息 */
export interface LocationInfo {
  name: string
  address: string
  lat: number
  lng: number
  poiId?: string | null
}
