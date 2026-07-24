/**
 * 金额展示 — 实现见 shared-utils/budget（formatMoney / formatAmount*）
 */
export {
  formatAmount,
  formatAmountWithType,
  formatAmountByType,
  formatMoney,
  formatMoneyByType,
} from './budget'

// 预算语义（进度阈值 / 金额）— 详见 ./budget
export {
  getBudgetVariant,
  isBudgetOver,
  sortBudgetCategoriesByRisk,
  BUDGET_WARN_AT,
  BUDGET_OVER_AT,
  budgetStatusToVariant,
  budgetVariantLabel,
} from './budget'
export type { BudgetVariant, BudgetCategoryLike } from './budget'

// 日期 — 详见 ./date
export {
  formatDate,
  formatDateYMD,
  formatBeijingYMD,
  formatFriendlyDate,
  formatDateTime,
  formatDateTimeMinute,
  todayBeijing,
  parseDateInput,
} from './date'

export { getErrorMessage } from './errorMessage'

export { notifyError, notifySuccess, notifyInfo } from './notifyError'

export { monthDateRange, toMonthKey, parseMonthKey, formatMonthDisplay, formatMonthDisplayCompact } from './month'
