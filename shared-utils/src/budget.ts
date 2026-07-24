import { isIncomeType } from './transactionType'

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
 * - wan: ≥1 万显示为 X.X万（小屏/指标卡）
 */
export function formatMoney(
  amount: number | string,
  options: { compact?: boolean; wan?: boolean; showSign?: boolean; sign?: '+' | '-' } = {},
): string {
  const { compact = false, wan = false, showSign = false, sign = '+' } = options
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) {
    return compact || wan ? '¥0' : '¥ 0.00'
  }
  const abs = Math.abs(num)
  let body: string
  if (wan && abs >= 10000) {
    const wanVal = abs / 10000
    const wanText = wanVal.toFixed(abs % 10000 === 0 ? 0 : 1)
    body = `¥${wanText}万`
  } else {
    const formatted = abs.toLocaleString('zh-CN', {
      minimumFractionDigits: compact || wan ? 0 : 2,
      maximumFractionDigits: 2,
    })
    body = compact || wan ? `¥${formatted}` : `¥ ${formatted}`
  }
  if (showSign) return `${sign}${body}`
  // 保留负数语义（未显式 showSign 时）
  if (num < 0) return `-${body}`
  return body
}


/**
 * 金额数字简写（无货币符；≥1万 → X.X万）
 * 需要带 ¥ 时优先用 formatMoney(v, { wan: true })。
 */
export function fmtAmount(v: number): string {
  const abs = Math.abs(Number(v) || 0)
  if (abs >= 10000) {
    return (abs / 10000).toFixed(abs % 10000 === 0 ? 0 : 1) + '万'
  }
  return abs.toLocaleString('zh-CN')
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

/** 清理金额输入：仅保留数字与一个小数点，默认最多 2 位小数 */
export function sanitizeAmountInput(raw: string, maxDecimals = 2): string {
  const v = String(raw ?? '').replace(/[^0-9.]/g, '')
  const parts = v.split('.')
  if (parts.length === 1) return parts[0]
  return parts[0] + '.' + (parts[1] || '').slice(0, maxDecimals)
}

/** 是否为有效正数金额 */
export function isValidPositiveAmount(amount: string | number | null | undefined): boolean {
  if (amount === null || amount === undefined || amount === '') return false
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return Number.isFinite(num) && num > 0
}

/** 解析金额为 number，非法时返回 0 */
export function parseAmount(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined || amount === '') return 0
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return Number.isFinite(num) ? num : 0
}

/** 按收支类型带符号的金额展示 */
export function formatMoneyByType(
  amount: number | string,
  type?: string | null,
  options: { compact?: boolean; wan?: boolean } = {},
): string {
  return formatMoney(amount, {
    ...options,
    showSign: true,
    sign: isIncomeType(type) ? '+' : '-',
  })
}

/** 兼容旧调用：固定 2 位小数；新代码优先 formatMoney */
export function formatAmount(amount: number | string, showSign = false, sign: '+' | '-' = '+'): string {
  return formatMoney(amount, { showSign, sign })
}

export function formatAmountWithType(amount: number | string, isIncome: boolean): string {
  return formatMoney(amount, { showSign: true, sign: isIncome ? '+' : '-' })
}

/** 按收支类型加 +/- 前缀（与 formatMoneyByType 同语义，默认非 compact） */
export function formatAmountByType(amount: number | string, type?: string | null): string {
  return formatMoneyByType(amount, type)
}

/** 解析非负金额（非法 → 0） */
export function parseNonNegativeAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (!Number.isFinite(num)) return 0
  return Math.max(0, num)
}

export type BudgetCategoryRef = { id: string; name?: string }
export type BudgetUpsertItem = { category: string; amount: number }

/**
 * 构建预算 upsert 列表：
 * - 当前金额 > 0 的分类
 * - 或原先有预算、现清零的分类（amount=0 以落库）
 *
 * @param valueKey 编辑态 Map 的 key：PC 用分类 name，Taro 用 id
 */
export function buildBudgetUpsertItems(
  categories: readonly BudgetCategoryRef[],
  values: Record<string, number>,
  previousByCategoryId: Map<string, number> | Record<string, number>,
  options: { valueKey?: 'id' | 'name' } = {},
): BudgetUpsertItem[] {
  const valueKey = options.valueKey ?? 'id'
  const prevOf = (id: string): number => {
    if (previousByCategoryId instanceof Map) return previousByCategoryId.get(id) || 0
    return previousByCategoryId[id] || 0
  }
  return categories
    .map((cat) => {
      const key = valueKey === 'name' ? (cat.name || cat.id) : cat.id
      const amount = values[key] || 0
      const prev = prevOf(cat.id)
      if (amount > 0 || prev > 0) return { category: cat.id, amount }
      return null
    })
    .filter((x): x is BudgetUpsertItem => x !== null)
}

/** 单分类预算条目（详情编辑/清零） */
export function buildSingleBudgetItem(
  categoryId: string,
  amount: string | number,
): BudgetUpsertItem {
  return { category: categoryId, amount: parseNonNegativeAmount(amount) }
}
