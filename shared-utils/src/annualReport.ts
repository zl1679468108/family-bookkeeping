/**
 * 年报数据归一化 — 接口字段容错，保证 UI 始终拿到安全结构
 * 纯函数，无 React / 平台依赖
 */

export type AnnualOverview = {
  total_income: number
  total_expense: number
  balance: number
  balance_rate: number
}

export type AnnualMonthlyItem = {
  month: number
  income: number
  expense: number
}

export type AnnualCategoryItem = {
  category_name: string
  category_icon: string
  category_type: string
  amount: number
  percentage: number
}

export type AnnualRecordItem = {
  amount: number
  description?: string
  counterparty?: string
  date?: string
  count?: number
}

export type AnnualRecords = {
  max_expense: AnnualRecordItem | null
  max_expense_day: AnnualRecordItem | null
  max_expense_merchant: AnnualRecordItem | null
}

export type AnnualBookItem = {
  book_id: string
  book_name: string
  amount: number
  percentage: number
}

export type AnnualMemberItem = {
  user_id: string
  nickname: string
  expense: number
  percentage: number
}

export type AnnualFunFact = {
  dining_total: number
  daily_avg_expense: number
  max_continuous_days: number
}

export type AnnualReportData = {
  overview: AnnualOverview
  monthly: AnnualMonthlyItem[]
  top_categories: AnnualCategoryItem[]
  records: AnnualRecords
  book_breakdown: AnnualBookItem[]
  member_ranking: AnnualMemberItem[]
  fun_fact: AnnualFunFact
}

const EMPTY_OVERVIEW: AnnualOverview = {
  total_income: 0,
  total_expense: 0,
  balance: 0,
  balance_rate: 0,
}

const EMPTY_RECORDS: AnnualRecords = {
  max_expense: null,
  max_expense_day: null,
  max_expense_merchant: null,
}

const EMPTY_FUN_FACT: AnnualFunFact = {
  dining_total: 0,
  daily_avg_expense: 0,
  max_continuous_days: 0,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) return numericValue
  }
  return fallback
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function clampPercent(value: unknown): number {
  return Math.min(100, Math.max(0, Math.round(toFiniteNumber(value))))
}

function normalizeRecordItem(value: unknown): AnnualRecordItem | null {
  if (!isRecord(value)) return null

  const countValue = toFiniteNumber(value.count, NaN)
  return {
    amount: Math.max(0, toFiniteNumber(value.amount)),
    description: toStringValue(value.description),
    counterparty: toStringValue(value.counterparty),
    date: toStringValue(value.date),
    count: Number.isFinite(countValue) ? Math.max(0, Math.round(countValue)) : undefined,
  }
}

/** 将接口原始年报归一为安全结构；null/undefined → undefined */
export function normalizeAnnualReport(rawData: unknown): AnnualReportData | undefined {
  if (rawData === null || rawData === undefined) return undefined

  const source = isRecord(rawData) ? rawData : {}
  const overview = isRecord(source.overview) ? source.overview : {}
  const records = isRecord(source.records) ? source.records : {}
  const funFact = isRecord(source.fun_fact) ? source.fun_fact : {}

  return {
    overview: {
      total_income: Math.max(0, toFiniteNumber(overview.total_income, EMPTY_OVERVIEW.total_income)),
      total_expense: Math.max(0, toFiniteNumber(overview.total_expense, EMPTY_OVERVIEW.total_expense)),
      balance: toFiniteNumber(overview.balance, EMPTY_OVERVIEW.balance),
      balance_rate: clampPercent(overview.balance_rate),
    },
    monthly: Array.isArray(source.monthly)
      ? source.monthly.map((item, index) => {
          const monthlyItem = isRecord(item) ? item : {}
          return {
            month: Math.min(12, Math.max(1, Math.round(toFiniteNumber(monthlyItem.month, index + 1)))),
            income: Math.max(0, toFiniteNumber(monthlyItem.income)),
            expense: Math.max(0, toFiniteNumber(monthlyItem.expense)),
          }
        })
      : [],
    top_categories: Array.isArray(source.top_categories)
      ? source.top_categories.map((item, index) => {
          const category = isRecord(item) ? item : {}
          return {
            category_name: toStringValue(category.category_name, `分类 ${index + 1}`),
            category_icon: toStringValue(category.category_icon, '📦'),
            category_type: toStringValue(category.category_type, 'expense'),
            amount: Math.max(0, toFiniteNumber(category.amount)),
            percentage: clampPercent(category.percentage),
          }
        })
      : [],
    records: {
      max_expense: normalizeRecordItem(records.max_expense) ?? EMPTY_RECORDS.max_expense,
      max_expense_day: normalizeRecordItem(records.max_expense_day) ?? EMPTY_RECORDS.max_expense_day,
      max_expense_merchant: normalizeRecordItem(records.max_expense_merchant) ?? EMPTY_RECORDS.max_expense_merchant,
    },
    book_breakdown: Array.isArray(source.book_breakdown)
      ? source.book_breakdown.map((item, index) => {
          const book = isRecord(item) ? item : {}
          return {
            book_id: toStringValue(book.book_id, `book-${index}`),
            book_name: toStringValue(book.book_name, `账本 ${index + 1}`),
            amount: Math.max(0, toFiniteNumber(book.amount)),
            percentage: clampPercent(book.percentage),
          }
        })
      : [],
    member_ranking: Array.isArray(source.member_ranking)
      ? source.member_ranking.map((item, index) => {
          const member = isRecord(item) ? item : {}
          return {
            user_id: toStringValue(member.user_id, `member-${index}`),
            nickname: toStringValue(member.nickname, `成员 ${index + 1}`),
            expense: Math.max(0, toFiniteNumber(member.expense)),
            percentage: clampPercent(member.percentage),
          }
        })
      : [],
    fun_fact: {
      dining_total: Math.max(0, toFiniteNumber(funFact.dining_total, EMPTY_FUN_FACT.dining_total)),
      daily_avg_expense: Math.max(0, toFiniteNumber(funFact.daily_avg_expense, EMPTY_FUN_FACT.daily_avg_expense)),
      max_continuous_days: Math.max(
        0,
        Math.round(toFiniteNumber(funFact.max_continuous_days, EMPTY_FUN_FACT.max_continuous_days)),
      ),
    },
  }
}

/** 奶茶单价（趣味彩蛋换算） */
export const FUN_FACT_MILK_TEA_UNIT_PRICE = 15

/** {year}年度 */
export function annualYearLabel(year: number): string {
  return `${year}年度`
}

/** {nick}，您的年度财务总结 */
export function annualReportSubtitle(nickname: string): string {
  return `${nickname}，您的年度财务总结`
}

/** {year}年度报告.png */
export function annualReportFilename(year: number): string {
  return `${year}年度报告.png`
}

/** 生成于 {zh-CN 日期} */
export function annualReportGeneratedAt(date: Date = new Date()): string {
  const today = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return `生成于 ${today}`
}

/** © {appName} - 记录每一笔，看见每一步 */
export function annualReportCopyright(appName: string): string {
  return `© ${appName} - 记录每一笔，看见每一步`
}

/** 餐饮总额 → 约合奶茶杯数 */
export function milkTeaCupsFromDining(
  diningTotal: number,
  unitPrice: number = FUN_FACT_MILK_TEA_UNIT_PRICE,
): number {
  const price = unitPrice > 0 ? unitPrice : FUN_FACT_MILK_TEA_UNIT_PRICE
  return Math.round(Number(diningTotal || 0) / price)
}

/** 相当于 N 杯奶茶（¥15/杯） */
export function milkTeaEquivalentLabel(
  cups: number,
  unitPrice: number = FUN_FACT_MILK_TEA_UNIT_PRICE,
): string {
  return `相当于 ${Number(cups || 0).toLocaleString()} 杯奶茶（¥${unitPrice}/杯）`
}

/** N 天 */
export function continuousDaysLabel(days: number): string {
  return `${Number(days || 0)} 天`
}

