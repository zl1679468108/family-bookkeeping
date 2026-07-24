/**
 * 报表/统计周期区间纯函数 — PC 报表与 Taro 首页/统计对齐
 * 不依赖 date-fns，统一自然月口径
 */

import { formatDateYMD } from './date'
import { monthDateRange, parseMonthKey } from './month'

/** 与历史 PC PeriodType 取值对齐 */
export const REPORT_PERIOD = {
  Month: 'month',
  ThreeMonth: '3month',
  SixMonth: '6month',
  Year: 'year',
  MonthCompare: 'monthCompare',
  YearCompare: 'yearCompare',
} as const

export type ReportPeriodType = (typeof REPORT_PERIOD)[keyof typeof REPORT_PERIOD]

/** 兼容旧 enum 风格命名 */
export const PeriodType = REPORT_PERIOD
/** 与 const 同名，便于 useState<PeriodType> */
export type PeriodType = ReportPeriodType

export const REPORT_PERIOD_OPTIONS = [
  { key: REPORT_PERIOD.Month, label: '本月' },
  { key: REPORT_PERIOD.ThreeMonth, label: '近 3 月' },
  { key: REPORT_PERIOD.SixMonth, label: '近 6 月' },
  { key: REPORT_PERIOD.Year, label: '近 1 年' },
  { key: REPORT_PERIOD.MonthCompare, label: '月对比' },
  { key: REPORT_PERIOD.YearCompare, label: '年对比' },
] as const

export type ReportPeriodRange = {
  startDate: string
  endDate: string
  months: number
  /** YYYY-MM，用于按日汇总请求 */
  dailyDataMonths: string[]
  yearCompare: { currentYear: number; compareYear: number } | null
}

export function toYearMonth(input: Date | string): string {
  if (input instanceof Date) {
    return `${input.getFullYear()}-${String(input.getMonth() + 1).padStart(2, '0')}`
  }
  const s = String(input || '').trim()
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7)
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return toYearMonth(d)
  return s
}

/** 某 Date 所在自然月起止 */
export function monthBoundsFromDate(d: Date): { startDate: string; endDate: string } {
  const r = monthDateRange(d.getFullYear(), d.getMonth() + 1)
  return { startDate: r.start, endDate: r.end }
}

/** YYYY-MM / YYYY-MM-DD → 该自然月起止 */
export function monthBoundsFromKey(monthKey: string): { startDate: string; endDate: string } {
  const key = toYearMonth(monthKey)
  const { year, month } = parseMonthKey(`${key}-01`)
  const r = monthDateRange(year, month)
  return { startDate: r.start, endDate: r.end }
}

/**
 * 近 N 个自然月（含当月）
 * monthCount=1 → 本月；3 → 往前 2 个月月初 ~ 本月月末
 */
export function trailingCalendarMonthsRange(
  now: Date,
  monthCount: number,
): { startDate: string; endDate: string; months: number } {
  const count = Math.max(1, Math.floor(monthCount))
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const start = new Date(now.getFullYear(), now.getMonth() - (count - 1), 1)
  return {
    startDate: formatDateYMD(start),
    endDate: formatDateYMD(end),
    months: count,
  }
}

/** 本月 1 号 → 今天（首页摘要/本月流水） */
export function monthToDateRange(now: Date = new Date()): {
  startDate: string
  endDate: string
} {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return { startDate: formatDateYMD(start), endDate: formatDateYMD(now) }
}

/** 以指定月份为终点的近 12 个自然月 */
export function trailingYearRangeEndingAt(endMonth: Date): {
  startDate: string
  endDate: string
} {
  const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0)
  const start = new Date(endMonth.getFullYear(), endMonth.getMonth() - 11, 1)
  return { startDate: formatDateYMD(start), endDate: formatDateYMD(end) }
}

export type ResolveReportPeriodInput = {
  period: ReportPeriodType | string
  now?: Date
  /** YYYY-MM */
  monthCompareTarget?: string
  yearCompareTarget?: number
}

/** 报表主区间（与历史 PC useReportData switch 行为对齐） */
export function resolveReportPeriodRange(
  input: ResolveReportPeriodInput,
): ReportPeriodRange {
  const now = input.now ?? new Date()
  const currentMonth = toYearMonth(now)
  const currentYear = now.getFullYear()
  const period = String(input.period || REPORT_PERIOD.Month)

  switch (period) {
    case REPORT_PERIOD.Month: {
      const b = monthBoundsFromDate(now)
      return {
        ...b,
        months: 1,
        dailyDataMonths: [currentMonth],
        yearCompare: null,
      }
    }
    case REPORT_PERIOD.ThreeMonth: {
      const r = trailingCalendarMonthsRange(now, 3)
      return { ...r, dailyDataMonths: [], yearCompare: null }
    }
    case REPORT_PERIOD.SixMonth: {
      const r = trailingCalendarMonthsRange(now, 6)
      return { ...r, dailyDataMonths: [], yearCompare: null }
    }
    case REPORT_PERIOD.Year: {
      const r = trailingCalendarMonthsRange(now, 12)
      return { ...r, dailyDataMonths: [], yearCompare: null }
    }
    case REPORT_PERIOD.MonthCompare: {
      const fallbackTarget = toYearMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      const target = toYearMonth(input.monthCompareTarget || fallbackTarget)
      return {
        startDate: monthBoundsFromKey(target).startDate,
        endDate: monthBoundsFromDate(now).endDate,
        months: 2,
        dailyDataMonths: [target, currentMonth],
        yearCompare: null,
      }
    }
    case REPORT_PERIOD.YearCompare: {
      const r = trailingCalendarMonthsRange(now, 12)
      return {
        ...r,
        dailyDataMonths: [],
        yearCompare: {
          currentYear,
          compareYear: input.yearCompareTarget ?? currentYear - 1,
        },
      }
    }
    default: {
      const b = monthBoundsFromDate(now)
      return {
        ...b,
        months: 1,
        dailyDataMonths: [currentMonth],
        yearCompare: null,
      }
    }
  }
}

export function isReportDailyView(period: string): boolean {
  return period === REPORT_PERIOD.Month
}

export function isReportMonthCompare(period: string): boolean {
  return period === REPORT_PERIOD.MonthCompare
}

export function isReportYearCompare(period: string): boolean {
  return period === REPORT_PERIOD.YearCompare
}

export function isReportMonthlyTrendView(period: string): boolean {
  return (
    period === REPORT_PERIOD.ThreeMonth ||
    period === REPORT_PERIOD.SixMonth ||
    period === REPORT_PERIOD.Year
  )
}
