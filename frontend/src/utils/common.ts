export function formatAmount(amount: number | string, showSign = false, sign: '+' | '-' = '+'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (Number.isNaN(num)) {
    return '¥ 0.00'
  }

  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  if (showSign) {
    return `${sign}¥ ${formatted}`
  }

  return `¥ ${formatted}`
}

export function formatAmountWithType(amount: number | string, isIncome: boolean): string {
  const sign = isIncome ? '+' : '-'
  return formatAmount(amount, true, sign as '+' | '-')
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
  formatFriendlyDate,
  todayBeijing,
  parseDateInput,
} from './date'

export { getErrorMessage } from './errorMessage'

export { notifyError, notifySuccess } from './notifyError'

export { monthDateRange, toMonthKey, parseMonthKey } from './month'
