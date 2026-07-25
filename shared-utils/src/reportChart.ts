/**
 * 报表趋势图序列纯函数 — 与视图类型无关的数据映射
 */

export type DailySummaryLike = {
  date: string
  total_expense?: number | string | null
  total_income?: number | string | null
}

export type MonthCompareBuckets = {
  currentMonth: readonly DailySummaryLike[]
  targetMonth: readonly DailySummaryLike[]
}

export type YoyPointLike = {
  monthLabel: string
  currentYear?: number | string | null
  lastYear?: number | string | null
}

export type MonthlyTrendLike = {
  month: string
  expense?: number | string | null
  income?: number | string | null
}

export type DailyTrendSeries = {
  dates: string[]
  expenses: number[]
  incomes: number[]
}

export type MonthCompareSeries = {
  dates: string[]
  currExpenses: number[]
  currIncomes: number[]
  targetExpenses: number[]
  targetIncomes: number[]
}

export type YearCompareSeries = {
  dates: string[]
  currentYearExpenses: number[]
  targetYearExpenses: number[]
  currentYearIncomes: number[]
  targetYearIncomes: number[]
}

export type MonthlyTrendSeries = {
  dates: string[]
  expenses: number[]
  incomes: number[]
}

/** 视图联合后的宽类型，便于同一 chartData 变量访问各视图字段 */
export type ReportTrendSeriesLoose = {
  dates: string[]
  expenses?: number[]
  incomes?: number[]
  currExpenses?: number[]
  currIncomes?: number[]
  targetExpenses?: number[]
  targetIncomes?: number[]
  currentYearExpenses?: number[]
  currentYearIncomes?: number[]
  targetYearExpenses?: number[]
  targetYearIncomes?: number[]
}

export type ReportTrendTooltipPoint = {
  name?: string
  seriesName?: string
  value?: number | string | null
}

export function reportTrendSeriesName(label: string | number, metricLabel: string): string {
  return `${label} ${metricLabel}`
}

export function reportYearLabel(year: string | number): string {
  return `${year}年`
}

function tooltipValue(
  points: readonly ReportTrendTooltipPoint[],
  seriesName: string,
): number {
  const value = points.find((p) => p.seriesName === seriesName)?.value
  return Number(value || 0)
}

export function formatReportCompareTooltip(opts: {
  points: readonly ReportTrendTooltipPoint[]
  currentLabel: string | number
  targetLabel: string | number
  expenseLabel: string
  incomeLabel: string
  formatAmount: (value: number) => string
}): string {
  const currentExpenseName = reportTrendSeriesName(opts.currentLabel, opts.expenseLabel)
  const currentIncomeName = reportTrendSeriesName(opts.currentLabel, opts.incomeLabel)
  const targetExpenseName = reportTrendSeriesName(opts.targetLabel, opts.expenseLabel)
  const targetIncomeName = reportTrendSeriesName(opts.targetLabel, opts.incomeLabel)
  const title = opts.points[0]?.name || ''

  return [
    title,
    `${currentExpenseName}：${opts.formatAmount(tooltipValue(opts.points, currentExpenseName))}`,
    `${currentIncomeName}：${opts.formatAmount(tooltipValue(opts.points, currentIncomeName))}`,
    `${targetExpenseName}：${opts.formatAmount(tooltipValue(opts.points, targetExpenseName))}`,
    `${targetIncomeName}：${opts.formatAmount(tooltipValue(opts.points, targetIncomeName))}`,
  ].join('<br/>')
}

function dayLabelFromYmd(date: string): string {
  const day = parseInt(String(date || '').slice(8, 10), 10)
  return Number.isFinite(day) ? `${day}日` : String(date || '')
}

function monthLabelFromKey(month: string): string {
  const s = String(month || '')
  // YYYY-MM → MM月
  if (s.length >= 7) return `${s.slice(5)}月`
  return s
}

export function buildDailyTrendSeries(dailyData: readonly DailySummaryLike[] = []): DailyTrendSeries {
  return {
    dates: dailyData.map((d) => dayLabelFromYmd(d.date)),
    expenses: dailyData.map((d) => Number(d.total_expense || 0)),
    incomes: dailyData.map((d) => Number(d.total_income || 0)),
  }
}

export function buildMonthCompareSeries(data: MonthCompareBuckets): MonthCompareSeries {
  const current = data.currentMonth || []
  const target = data.targetMonth || []
  const maxDays = Math.max(current.length, target.length)
  return {
    dates: Array.from({ length: maxDays }, (_, i) => `${i + 1}日`),
    currExpenses: current.map((d) => Number(d.total_expense || 0)),
    currIncomes: current.map((d) => Number(d.total_income || 0)),
    targetExpenses: target.map((d) => Number(d.total_expense || 0)),
    targetIncomes: target.map((d) => Number(d.total_income || 0)),
  }
}

export function buildYearCompareSeries(
  yoyExpenseData: readonly YoyPointLike[] = [],
  yoyIncomeData: readonly YoyPointLike[] = [],
): YearCompareSeries {
  return {
    dates: yoyExpenseData.map((d) => d.monthLabel),
    currentYearExpenses: yoyExpenseData.map((d) => Number(d.currentYear || 0)),
    targetYearExpenses: yoyExpenseData.map((d) => Number(d.lastYear || 0)),
    currentYearIncomes: yoyIncomeData.map((d) => Number(d.currentYear || 0)),
    targetYearIncomes: yoyIncomeData.map((d) => Number(d.lastYear || 0)),
  }
}

export function buildMonthlyTrendSeries(trendData: readonly MonthlyTrendLike[] = []): MonthlyTrendSeries {
  return {
    dates: trendData.map((d) => monthLabelFromKey(d.month)),
    expenses: trendData.map((d) => Number(d.expense || 0)),
    incomes: trendData.map((d) => Number(d.income || 0)),
  }
}

export type ReportTrendViewFlags = {
  isDailyView?: boolean
  isMonthCompare?: boolean
  isYearCompare?: boolean
}

export type BuildReportTrendSeriesInput = ReportTrendViewFlags & {
  dailyData?: readonly DailySummaryLike[]
  monthCompareData?: MonthCompareBuckets
  yoyExpenseData?: readonly YoyPointLike[]
  yoyIncomeData?: readonly YoyPointLike[]
  trendData?: readonly MonthlyTrendLike[]
}

/** 按视图标志选择序列（与历史 TrendChart useMemo 对齐） */
export function buildReportTrendSeries(input: BuildReportTrendSeriesInput) {
  if (input.isDailyView) return buildDailyTrendSeries(input.dailyData)
  if (input.isMonthCompare) {
    return buildMonthCompareSeries(
      input.monthCompareData || { currentMonth: [], targetMonth: [] },
    )
  }
  if (input.isYearCompare) {
    return buildYearCompareSeries(input.yoyExpenseData, input.yoyIncomeData)
  }
  return buildMonthlyTrendSeries(input.trendData)
}
