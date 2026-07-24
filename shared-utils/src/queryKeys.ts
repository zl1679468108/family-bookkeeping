/**
 * 统一 React Query key 工厂。
 * 约定：资源名在前，bookId 其次，便于 invalidateQueries({ queryKey: ['transactions'] }) 整组失效。
 */
export type TxListFilters = {
  type?: string
  category?: string
  startDate?: string
  endDate?: string
  search?: string
  minAmount?: string
  maxAmount?: string
  page?: number
  pageSize?: number
}

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: ['auth', 'profile'] as const,
  },

  books: {
    all: ['books'] as const,
    list: (userId: string) => ['books', userId] as const,
    membersRoot: ['book-members'] as const,
    members: (bookId: string) => ['book-members', bookId] as const,
  },

  categories: {
    all: ['categories'] as const,
    list: (bookId: string) => ['categories', bookId] as const,
  },

  templates: {
    all: ['templates'] as const,
    list: (bookId: string) => ['templates', bookId] as const,
  },

  transactions: {
    all: ['transactions'] as const,
    list: (bookId: string, filters: TxListFilters) =>
      ['transactions', bookId, 'list', filters] as const,
    recent: (bookId: string, from: string, to: string) =>
      ['transactions', bookId, 'recent', from, to] as const,
    byDate: (bookId: string, date: string) =>
      ['transactions', bookId, 'by-date', date] as const,
    detail: (bookId: string, id: number) =>
      ['transactions', bookId, 'detail', id] as const,
  },

  statistics: {
    all: ['statistics'] as const,
    summary: (bookId: string, from: string, to: string) =>
      ['statistics', bookId, 'summary', from, to] as const,
    monthlyTrend: (bookId: string, months: number, endDate: string) =>
      ['statistics', bookId, 'monthly-trend', months, endDate] as const,
    dailySummary: (bookId: string, months: string | string[]) =>
      ['statistics', bookId, 'daily-summary', months] as const,
    categoryBreakdown: (bookId: string, from: string, to: string, type: string) =>
      ['statistics', bookId, 'category-breakdown', from, to, type] as const,
    yoy: (bookId: string, year?: number, compareYear?: number, type?: string) =>
      ['statistics', bookId, 'yoy-comparison', year, compareYear, type] as const,
    memberComparison: (bookId: string, from?: string, to?: string) =>
      ['statistics', bookId, 'member-comparison', from, to] as const,
  },

  budgets: {
    all: ['budgets'] as const,
    list: (bookId: string, month: string) => ['budgets', bookId, month] as const,
    status: (bookId: string, month: string) =>
      ['budgets', bookId, 'status', month] as const,
  },

  map: {
    all: ['map'] as const,
    transactions: (bookId: string, key: unknown) =>
      ['map', bookId, 'transactions', key] as const,
    merchants: (bookId: string, key: unknown) =>
      ['map', bookId, 'merchants', key] as const,
    members: (bookId: string) => ['mapMembers', bookId] as const,
    memberLocations: (bookId: string) => ['memberLocations', bookId] as const,
    merchantTx: (bookId: string, poiId: string | null | undefined, name: string) =>
      ['merchant-transactions', bookId, poiId, name] as const,
  },

  annualReport: {
    all: ['annual-report'] as const,
    year: (bookId: string, year: number) => ['annual-report', bookId, year] as const,
  },

  customIcons: {
    all: ['customIcons'] as const,
    byType: (type: string) => ['customIcons', type] as const,
  },

  admin: {
    all: ['admin'] as const,
    stats: ['admin', 'stats'] as const,
    users: (...parts: unknown[]) => ['admin', 'users', ...parts] as const,
    usersForSelect: ['admin', 'users-for-select'] as const,
    booksForSelect: ['admin', 'books-for-select'] as const,
    transactions: (...parts: unknown[]) => ['admin', 'transactions', ...parts] as const,
  },
} as const

/** 切换账本时需要失效的资源根 key */
export const BOOK_SCOPED_ROOT_KEYS: readonly (readonly unknown[])[] = [
  queryKeys.transactions.all,
  queryKeys.statistics.all,
  queryKeys.budgets.all,
  queryKeys.categories.all,
  queryKeys.templates.all,
  queryKeys.map.all,
  queryKeys.annualReport.all,
  ['mapMembers'],
  ['memberLocations'],
  ['merchant-transactions'],
  ['book-members'],
]

/** 登录/登出/切账号时清理的业务缓存根 */
export const USER_SCOPED_ROOT_KEYS: readonly (readonly unknown[])[] = [
  queryKeys.books.all,
  queryKeys.transactions.all,
  queryKeys.statistics.all,
  queryKeys.budgets.all,
  queryKeys.categories.all,
  queryKeys.templates.all,
  queryKeys.map.all,
  queryKeys.annualReport.all,
  queryKeys.customIcons.all,
  queryKeys.admin.all,
  ['mapMembers'],
  ['memberLocations'],
  ['merchant-transactions'],
  ['book-members'],
  ['reports'],
]

/** 记一笔/删改流水后需要联动失效的根 key */
export const TRANSACTION_IMPACT_ROOT_KEYS: readonly (readonly unknown[])[] = [
  queryKeys.transactions.all,
  queryKeys.statistics.all,
  queryKeys.budgets.all,
  queryKeys.map.all,
  queryKeys.annualReport.all,
  ['mapMembers'],
  ['memberLocations'],
  ['merchant-transactions'],
]

