/**
 * 月份区间工具 — 与 Taro useMonthSelector 对齐
 */
import { formatDateYMD } from './date'

/** 某年某月的起止日期 YYYY-MM-DD（month 1-12） */
export function monthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return { start: formatDateYMD(start), end: formatDateYMD(end) }
}

/** 月份 key：YYYY-MM-01 */
export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

/** 解析 YYYY-MM-01 / YYYY-MM-DD → { year, month } */
export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}

/**
 * 月份展示：2024 年 07 月
 * 接受 Date / YYYY-MM / YYYY-MM-DD / YYYY-MM-01
 */
/** 年月数字 → 2024 年 07 月 */
export function formatYearMonthDisplay(year: number, month: number): string {
  return formatMonthDisplay(`${Number(year)}-${String(month).padStart(2, '0')}`)
}

export function formatMonthDisplay(input: string | Date): string {
  const { year, month } = resolveYearMonth(input)
  if (!year || !month) {
    return typeof input === 'string' ? input : ''
  }
  return `${year} 年 ${String(month).padStart(2, '0')} 月`
}

/**
 * 紧凑月份：2024年7月（图表轴等）
 */
export function formatMonthDisplayCompact(input: string | Date): string {
  const { year, month } = resolveYearMonth(input)
  if (!year || !month) {
    return typeof input === 'string' ? input : ''
  }
  return `${year}年${month}月`
}

function resolveYearMonth(input: string | Date): { year: number; month: number } {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return { year: 0, month: 0 }
    return { year: input.getFullYear(), month: input.getMonth() + 1 }
  }
  const s = String(input || '').trim()
  const m = s.match(/^(\d{4})-(\d{1,2})/)
  if (m) return { year: Number(m[1]), month: Number(m[2]) }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  }
  return { year: 0, month: 0 }
}

export type MonthOption = {
  key: string
  label: string
  isHeader?: boolean
}

export type MonthKeyFormat = 'monthDay' | 'month'
export type MonthLabelStyle = 'monthOnly' | 'yearMonth' | 'yearMonthPad'

export type GenerateMonthOptionsParams = {
  yearsBefore?: number
  yearsAfter?: number
  now?: Date
  /** monthDay=YYYY-MM-01；month=YYYY-MM */
  keyFormat?: MonthKeyFormat
  /** monthOnly=MM 月；yearMonth=2024年7月；yearMonthPad=2024 年 07 月 */
  labelStyle?: MonthLabelStyle
  /** 是否插入年份分组头 */
  withYearHeaders?: boolean
}

/** 当前月 key（默认 YYYY-MM-01） */
export function currentMonthKey(
  now: Date = new Date(),
  keyFormat: MonthKeyFormat = 'monthDay',
): string {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  if (keyFormat === 'month') return `${year}-${String(month).padStart(2, '0')}`
  return toMonthKey(year, month)
}

/**
 * 生成年月选项（Budgets/Map 分组下拉、报表月份、日历月份共用）
 */
export function generateMonthOptions(params: GenerateMonthOptionsParams = {}): MonthOption[] {
  const {
    yearsBefore = 3,
    yearsAfter = 1,
    now = new Date(),
    keyFormat = 'monthDay',
    labelStyle = 'monthOnly',
    withYearHeaders = keyFormat === 'monthDay' && labelStyle === 'monthOnly',
  } = params

  const currentYear = now.getFullYear()
  const startYear = currentYear - yearsBefore
  const endYear = currentYear + yearsAfter
  const result: MonthOption[] = []

  for (let year = startYear; year <= endYear; year += 1) {
    if (withYearHeaders) {
      result.push({ key: `year-${year}`, label: `${year} 年`, isHeader: true })
    }
    for (let month = 1; month <= 12; month += 1) {
      const key =
        keyFormat === 'month'
          ? `${year}-${String(month).padStart(2, '0')}`
          : toMonthKey(year, month)
      let label: string
      if (labelStyle === 'monthOnly') {
        label = `${String(month).padStart(2, '0')} 月`
      } else if (labelStyle === 'yearMonthPad') {
        label = formatMonthDisplay(key)
      } else {
        label = formatMonthDisplayCompact(key)
      }
      result.push({ key, label })
    }
  }
  return result
}

export type GenerateYearOptionsParams = {
  yearsBefore?: number
  yearsAfter?: number
  now?: Date
  /** true: 从新到旧 */
  descending?: boolean
  /** spaced: "2024 年"；compact: "2024年" */
  labelStyle?: 'spaced' | 'compact'
}

/** 年份选项（年报/报表对比） */
export function generateYearOptions(
  params: GenerateYearOptionsParams = {},
): Array<{ key: string; label: string }> {
  const {
    yearsBefore = 5,
    yearsAfter = 0,
    now = new Date(),
    descending = false,
    labelStyle = 'spaced',
  } = params
  const currentYear = now.getFullYear()
  const years: number[] = []
  for (let y = currentYear - yearsBefore; y <= currentYear + yearsAfter; y += 1) {
    years.push(y)
  }
  if (descending) years.reverse()
  return years.map((y) => ({
    key: String(y),
    label: labelStyle === 'compact' ? `${y}年` : `${y} 年`,
  }))
}



/**
 * 枚举闭区间内的月份 key（YYYY-MM）
 * from/to 支持 YYYY-MM 或 YYYY-MM-DD
 */
export function generateMonthKeysBetween(from: string, to: string): string[] {
  const months: string[] = []
  const [fy, fm] = String(from || '').split('-').map(Number)
  const [ty, tm] = String(to || '').split('-').map(Number)
  if (!fy || !fm || !ty || !tm) return months
  let y = fy
  let m = fm
  // 防止死循环：最多 600 个月（50 年）
  for (let i = 0; i < 600; i += 1) {
    if (y > ty || (y === ty && m > tm)) break
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}
