/**
 * REST API 路径工厂 — 双端 services 共用，避免字面量漂移
 * 均为相对 /api 的 path（不含 baseURL）
 */

const enc = (v: string | number) => encodeURIComponent(String(v))

export const API_PATHS = {
  auth: {
    captcha: '/auth/captcha',
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    switchAccount: '/auth/switch-account',
    currentBook: '/auth/current-book',
    sendResetCode: '/auth/send-reset-code',
    resetPasswordByCode: '/auth/reset-password-by-code',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    deactivate: '/auth/deactivate',
  },

  books: {
    root: '/books',
    byId: (id: string) => `/books/${enc(id)}`,
    members: (bookId: string) => `/books/${enc(bookId)}/members`,
    member: (bookId: string, userId: string) =>
      `/books/${enc(bookId)}/members/${enc(userId)}`,
    leave: (bookId: string) => `/books/${enc(bookId)}/members/me`,
    transferOwner: (bookId: string) => `/books/${enc(bookId)}/transfer-owner`,
    invitations: (bookId: string) => `/books/${enc(bookId)}/invitations`,
    invitationByCode: (code: string) => `/books/invitations/${enc(code)}`,
    joinByCode: (code: string) => `/books/invitations/${enc(code)}/join`,
    checkOwner: (bookId: string) => `/books/${enc(bookId)}/check-owner`,
  },

  categories: {
    root: '/categories',
    list: (type?: string) => (type ? `/categories?type=${enc(type)}` : '/categories'),
    byId: (id: string) => `/categories/${enc(id)}`,
    reorder: '/categories/reorder',
  },

  templates: {
    root: '/templates',
    byId: (id: string) => `/templates/${enc(id)}`,
    execute: (id: string) => `/templates/${enc(id)}/execute`,
    reorder: '/templates/reorder',
    executeRecurring: '/templates/execute-recurring',
  },

  budgets: {
    root: '/budgets',
    list: (month: string) => `/budgets?month=${enc(month)}`,
    status: (month: string) => `/budgets/status?month=${enc(month)}`,
    copy: '/budgets/copy',
  },

  transactions: {
    root: '/transactions',
    byId: (id: string | number) => `/transactions/${enc(id)}`,
    batch: '/transactions/batch',
    receipt: (id: string | number) => `/transactions/${enc(id)}/receipt`,
    suggestCategory: (qs: string) => `/transactions/suggest-category?${qs}`,
    withQuery: (qs: string) => (qs ? `/transactions?${qs}` : '/transactions'),
  },

  statistics: {
    root: '/statistics',
    summary: (qs: string) => `/statistics/summary?${qs}`,
    monthlyTrend: (qs: string) => `/statistics/monthly-trend?${qs}`,
    categoryBreakdown: (qs: string) => `/statistics/category-breakdown?${qs}`,
    dailySummary: (qs: string) => `/statistics/daily-summary?${qs}`,
    yoy: (qs: string) => `/statistics/yoy-comparison?${qs}`,
    memberComparison: (qs: string) => `/statistics/member-comparison?${qs}`,
  },

  icons: {
    root: '/icons',
    list: (qs?: string) => (qs ? `/icons?${qs}` : '/icons'),
    upload: '/icons/upload',
    byId: (id: string) => `/icons/${enc(id)}`,
  },

  map: {
    transactions: (qs: string) => `/map/transactions?${qs}`,
    merchants: (qs: string) => `/map/merchants?${qs}`,
    merchantTransactions: (qs: string) => `/map/merchants/transactions?${qs}`,
    members: '/map/members',
    memberLocations: '/map/members/locations',
    location: '/map/location',
  },

  reports: {
    annual: (qs: string) => `/reports/annual?${qs}`,
  },

  ocr: {
    receipt: '/ocr/receipt',
  },

  export: {
    excel: (qs?: string) => (qs ? `/export/excel?${qs}` : '/export/excel'),
    pdf: (qs?: string) => (qs ? `/export/pdf?${qs}` : '/export/pdf'),
  },

  admin: {
    stats: '/admin/stats',
    users: (qs?: string) => (qs ? `/admin/users?${qs}` : '/admin/users'),
    user: (userId: string) => `/admin/users/${enc(userId)}`,
    userRole: (userId: string) => `/admin/users/${enc(userId)}/role`,
    userStatus: (userId: string) => `/admin/users/${enc(userId)}/status`,
    transactions: (qs?: string) =>
      qs ? `/admin/transactions?${qs}` : '/admin/transactions',
    books: '/admin/books',
  },
} as const

export type ApiPaths = typeof API_PATHS
