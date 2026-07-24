/**
 * 预算相关纯函数 — 首页/预算页/报表共用，保证进度阈值与金额格式一致
 */
export type BudgetVariant = 'safe' | 'warn' | 'danger'

/** 预警阈值（含）：进度 ≥ 此值视为 warn */
export const BUDGET_WARN_AT = 80
/** 超支阈值（含）：进度 ≥ 此值视为 danger */
export const BUDGET_OVER_AT = 100

export function getBudgetVariant(progress: number): BudgetVariant {
  if (progress >= BUDGET_OVER_AT) return 'danger'
  if (progress >= BUDGET_WARN_AT) return 'warn'
  return 'safe'
}

/** 是否超支 */
export function isBudgetOver(progress: number): boolean {
  return progress >= BUDGET_OVER_AT
}

/**
 * 金额展示（¥ + 本地化数字）
 * - compact: 整数优先（0~2 位小数），适合卡片摘要
 * - full: 固定 2 位小数，适合流水/报表
 */
export function formatMoney(
  amount: number | string,
  options: { compact?: boolean; showSign?: boolean; sign?: '+' | '-' } = {},
): string {
  const { compact = false, showSign = false, sign = '+' } = options
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) {
    return compact ? '¥0' : '¥ 0.00'
  }
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
  })
  const body = compact ? `¥${formatted}` : `¥ ${formatted}`
  return showSign ? `${sign}${body.replace(/^¥\s?/, '¥')}` : body
}

export interface BudgetCategoryLike {
  budget: number
  progress: number
}

/** 有预算的分类按超支优先、进度降序排列，可选截断 */
export function sortBudgetCategoriesByRisk<T extends BudgetCategoryLike>(
  categories: T[],
  limit?: number,
): T[] {
  const sorted = [...categories]
    .filter((cat) => cat.budget > 0)
    .sort((a, b) => {
      const aOver = isBudgetOver(a.progress) ? 1 : 0
      const bOver = isBudgetOver(b.progress) ? 1 : 0
      if (aOver !== bOver) return bOver - aOver
      return b.progress - a.progress
    })
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

/** 后端预算 status 字段 → UI 变体（over/warning/ok|normal） */
export function budgetStatusToVariant(status?: string | null): BudgetVariant {
  if (status === 'over') return 'danger'
  if (status === 'warning' || status === 'warn') return 'warn'
  return 'safe'
}

/** 变体中文标签 */
export function budgetVariantLabel(variant: BudgetVariant): string {
  if (variant === 'danger') return '超预算'
  if (variant === 'warn') return '接近预算'
  return '正常'
}

