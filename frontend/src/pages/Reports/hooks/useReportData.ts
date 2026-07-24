import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBook } from '../../../hooks/useBook'
import { queryKeys } from '../../../utils/queryKeys'
import { GC_TIME_LONG, STALE } from '../../../utils/cachePolicy'
import { fetchMonthlyTrend, fetchCategoryBreakdown, fetchDailySummary, fetchYearOverYear } from '../../../services/statisticsApi'
import type { CategoryBreakdownItem } from '@family-bookkeeping/shared-types'
import { mergeSortedBreakdowns, sumBreakdownAmounts } from '../../../utils/categoryBreakdown'
import { generateMonthOptions, generateYearOptions } from '../../../utils/month'
import {
  PeriodType,
  resolveReportPeriodRange,
  monthBoundsFromDate,
  monthBoundsFromKey,
  trailingYearRangeEndingAt,
  toYearMonth,
  isReportDailyView,
  isReportMonthCompare,
  isReportYearCompare,
  isReportMonthlyTrendView,
  REPORT_PERIOD_OPTIONS,
} from '../../../utils/reportPeriod'

export { PeriodType, REPORT_PERIOD_OPTIONS }

export type MergedBreakdownItem = CategoryBreakdownItem & { type: 'expense' | 'income' }
export function useReportData() {
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''
  const [period, setPeriod] = useState<PeriodType>(PeriodType.Month)
  const [monthCompareTarget, setMonthCompareTarget] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return toYearMonth(d)
  })
  const [yearCompareTarget, setYearCompareTarget] = useState(() => new Date().getFullYear() - 1)

  const now = useMemo(() => new Date(), [])
  const currentMonth = useMemo(() => toYearMonth(now), [now])
  const currentYear = useMemo(() => now.getFullYear(), [now])

  const yearOptions = useMemo(
    () =>
      generateYearOptions({
        yearsBefore: 5,
        yearsAfter: 5,
        now,
        labelStyle: 'compact',
      }),
    [now],
  )

  const monthOptions = useMemo(
    () =>
      generateMonthOptions({
        yearsBefore: 5,
        yearsAfter: 5,
        now,
        keyFormat: 'month',
        labelStyle: 'yearMonthPad',
        withYearHeaders: false,
      }).map(({ key, label }) => ({ key, label })),
    [now],
  )

  const { startDate, endDate, months, dailyDataMonths, yearCompare } = useMemo(
    () =>
      resolveReportPeriodRange({
        period,
        now,
        monthCompareTarget,
        yearCompareTarget,
      }),
    [period, now, monthCompareTarget, yearCompareTarget],
  )

  const isDailyView = isReportDailyView(period)
  const isMonthCompare = isReportMonthCompare(period)
  const isYearCompare = isReportYearCompare(period)
  const isMonthlyView = isReportMonthlyTrendView(period)

  // Queries — T-M31: 统一加 staleTime 避免重复请求
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: queryKeys.statistics.monthlyTrend(bookId, months, endDate),
    queryFn: () => fetchMonthlyTrend({ months, endDate, type: 'expense' }),
    enabled: !!bookId && !isDailyView && !isMonthCompare && !isYearCompare,
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const dailySummaryQueries = useQuery({
    queryKey: queryKeys.statistics.dailySummary(bookId, dailyDataMonths),
    queryFn: async () => {
      const results = await Promise.all(
        dailyDataMonths.map((month) => fetchDailySummary({ month })),
      )
      return results
    },
    enabled: !!bookId && (isDailyView || isMonthCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: yoyExpenseData = [], isLoading: yoyExpenseLoading } = useQuery({
    queryKey: queryKeys.statistics.yoy(bookId, yearCompare?.currentYear, yearCompare?.compareYear, 'expense'),
    queryFn: () => fetchYearOverYear({ year: yearCompare?.currentYear, compareYear: yearCompare?.compareYear, type: 'expense' }),
    enabled: !!bookId && isYearCompare && !!yearCompare,
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: yoyIncomeData = [], isLoading: yoyIncomeLoading } = useQuery({
    queryKey: queryKeys.statistics.yoy(bookId, yearCompare?.currentYear, yearCompare?.compareYear, 'income'),
    queryFn: () => fetchYearOverYear({ year: yearCompare?.currentYear, compareYear: yearCompare?.compareYear, type: 'income' }),
    enabled: !!bookId && isYearCompare && !!yearCompare,
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  // Date ranges for category breakdown
  const currentMonthRange = useMemo(() => monthBoundsFromDate(now), [now])

  const targetMonthRange = useMemo(() => monthBoundsFromKey(monthCompareTarget), [monthCompareTarget])

  const currentYearRange = useMemo(
    () => trailingYearRangeEndingAt(new Date(currentYear, now.getMonth(), 1)),
    [currentYear, now],
  )

  const targetYearRange = useMemo(
    () => trailingYearRangeEndingAt(new Date(yearCompareTarget, now.getMonth(), 1)),
    [yearCompareTarget, now],
  )

  // Category breakdown queries — T-M31: 加 staleTime
  const { data: expenseBreakdown = [], isLoading: expenseBreakdownLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, startDate, endDate, 'expense'),
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'expense' }),
    enabled: !!bookId && (!isMonthCompare && !isYearCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: incomeBreakdown = [], isLoading: incomeBreakdownLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, startDate, endDate, 'income'),
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'income' }),
    enabled: !!bookId && (!isMonthCompare && !isYearCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: currentMonthExpense = [], isLoading: currentMonthExpenseLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, currentMonthRange.startDate, currentMonthRange.endDate, 'expense'),
    queryFn: () => fetchCategoryBreakdown({ startDate: currentMonthRange.startDate, endDate: currentMonthRange.endDate, type: 'expense' }),
    enabled: !!bookId && (isMonthCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: currentMonthIncome = [], isLoading: currentMonthIncomeLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, currentMonthRange.startDate, currentMonthRange.endDate, 'income'),
    queryFn: () => fetchCategoryBreakdown({ startDate: currentMonthRange.startDate, endDate: currentMonthRange.endDate, type: 'income' }),
    enabled: !!bookId && (isMonthCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: targetMonthExpense = [], isLoading: targetMonthExpenseLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, targetMonthRange.startDate, targetMonthRange.endDate, 'expense'),
    queryFn: () => fetchCategoryBreakdown({ startDate: targetMonthRange.startDate, endDate: targetMonthRange.endDate, type: 'expense' }),
    enabled: !!bookId && (isMonthCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: targetMonthIncome = [], isLoading: targetMonthIncomeLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, targetMonthRange.startDate, targetMonthRange.endDate, 'income'),
    queryFn: () => fetchCategoryBreakdown({ startDate: targetMonthRange.startDate, endDate: targetMonthRange.endDate, type: 'income' }),
    enabled: !!bookId && (isMonthCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: currentYearExpense = [], isLoading: currentYearExpenseLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, currentYearRange.startDate, currentYearRange.endDate, 'expense'),
    queryFn: () => fetchCategoryBreakdown({ startDate: currentYearRange.startDate, endDate: currentYearRange.endDate, type: 'expense' }),
    enabled: !!bookId && (isYearCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: currentYearIncome = [], isLoading: currentYearIncomeLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, currentYearRange.startDate, currentYearRange.endDate, 'income'),
    queryFn: () => fetchCategoryBreakdown({ startDate: currentYearRange.startDate, endDate: currentYearRange.endDate, type: 'income' }),
    enabled: !!bookId && (isYearCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: targetYearExpense = [], isLoading: targetYearExpenseLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, targetYearRange.startDate, targetYearRange.endDate, 'expense'),
    queryFn: () => fetchCategoryBreakdown({ startDate: targetYearRange.startDate, endDate: targetYearRange.endDate, type: 'expense' }),
    enabled: !!bookId && (isYearCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: targetYearIncome = [], isLoading: targetYearIncomeLoading } = useQuery({
    queryKey: queryKeys.statistics.categoryBreakdown(bookId, targetYearRange.startDate, targetYearRange.endDate, 'income'),
    queryFn: () => fetchCategoryBreakdown({ startDate: targetYearRange.startDate, endDate: targetYearRange.endDate, type: 'income' }),
    enabled: !!bookId && (isYearCompare),
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  // Merge and sort breakdown data
  const mergedDefaultBreakdown = useMemo(
    () => mergeSortedBreakdowns(expenseBreakdown, incomeBreakdown) as MergedBreakdownItem[],
    [expenseBreakdown, incomeBreakdown],
  )
  const currentMonthMerged = useMemo(
    () => mergeSortedBreakdowns(currentMonthExpense, currentMonthIncome) as MergedBreakdownItem[],
    [currentMonthExpense, currentMonthIncome],
  )
  const targetMonthMerged = useMemo(
    () => mergeSortedBreakdowns(targetMonthExpense, targetMonthIncome) as MergedBreakdownItem[],
    [targetMonthExpense, targetMonthIncome],
  )
  const currentYearMerged = useMemo(
    () => mergeSortedBreakdowns(currentYearExpense, currentYearIncome) as MergedBreakdownItem[],
    [currentYearExpense, currentYearIncome],
  )
  const targetYearMerged = useMemo(
    () => mergeSortedBreakdowns(targetYearExpense, targetYearIncome) as MergedBreakdownItem[],
    [targetYearExpense, targetYearIncome],
  )

  const totalExpense = useMemo(() => sumBreakdownAmounts(expenseBreakdown), [expenseBreakdown])
  const totalIncome = useMemo(() => sumBreakdownAmounts(incomeBreakdown), [incomeBreakdown])

  const mainLoading = trendLoading || dailySummaryQueries.isLoading || yoyExpenseLoading || yoyIncomeLoading
  const categoryLoading = isMonthCompare
    ? currentMonthExpenseLoading || currentMonthIncomeLoading || targetMonthExpenseLoading || targetMonthIncomeLoading
    : isYearCompare
      ? currentYearExpenseLoading || currentYearIncomeLoading || targetYearExpenseLoading || targetYearIncomeLoading
      : expenseBreakdownLoading || incomeBreakdownLoading

  return {
    period, setPeriod,
    monthCompareTarget, setMonthCompareTarget,
    yearCompareTarget, setYearCompareTarget,
    now, currentMonth, currentYear,
    yearOptions, monthOptions,
    isDailyView, isMonthCompare, isYearCompare, isMonthlyView,
    months,
    trendData, dailySummaryQueries, yoyExpenseData, yoyIncomeData,
    mainLoading, categoryLoading,
    mergedDefaultBreakdown,
    currentMonthMerged, targetMonthMerged,
    currentYearMerged, targetYearMerged,
    totalExpense, totalIncome,
  }
}
