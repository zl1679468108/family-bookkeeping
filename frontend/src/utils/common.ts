import { formatMoney } from './budget'
import { isIncomeType } from './transactionType'

/**
 * 金额展示（固定 2 位小数）— 兼容旧调用。
 * 新代码优先用 formatMoney；需要 +/- 前缀用 formatAmountWithType。
 */
export function formatAmount(amount: number | string, showSign = false, sign: '+' | '-' = '+'): string {
  return formatMoney(amount, { showSign, sign })
}

export function formatAmountWithType(amount: number | string, isIncome: boolean): string {
  return formatMoney(amount, { showSign: true, sign: isIncome ? '+' : '-' })
}

/** 按收支类型加 +/- 前缀 */
export function formatAmountByType(amount: number | string, type?: string | null): string {
  return formatAmountWithType(amount, isIncomeType(type))
}
// 预算语义（进度阈值 / 金额）— 详见 ./budget
export {
  getBudgetVariant,
  isBudgetOver,
  formatMoney,
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
