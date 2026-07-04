import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns'
import { fetchMonthlyTrend, fetchCategoryBreakdown, fetchDailySummary, fetchYearOverYear } from '../../../services/statisticsApi'
import type { CategoryBreakdownItem } from '../../../types/statistics'

export enum PeriodType {
  Month = 'month',
  ThreeMonth = '3month',
  SixMonth = '6month',
  Year = 'year',
  MonthCompare = 'monthCompare',
  YearCompare = 'yearCompare',
}

export type MergedBreakdownItem = CategoryBreakdownItem & { type: 'expense' | 'income' }

export function useReportData() {
  const [period, setPeriod] = useState<PeriodType>(PeriodType.Month)
  const [monthCompareTarget, setMonthCompareTarget] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'))
  const [yearCompareTarget, setYearCompareTarget] = useState(new Date().getFullYear() - 1)

  const now = useMemo(() => new Date(), [])
  const currentMonth = useMemo(() => format(now, 'yyyy-MM'), [now])
  const currentYear = useMemo(() => now.getFullYear(), [now])

  const yearOptions = useMemo(() => {
    const years: { key: string; label: string }[] = []
    for (let i = -5; i <= 5; i++) {
      const y = currentYear + i
      years.push({ key: String(y), label: `${y}年` })
    }
    return years
  }, [currentYear])

  const monthOptions = useMemo(() => {
    const months: { key: string; label: string }[] = []
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      for (let i = 0; i < 12; i++) {
        const date = new Date(y, i, 1)
        months.push({
          key: format(date, 'yyyy-MM'),
          label: format(date, 'yyyy 年 MM 月'),
        })
      }
    }
    return months
  }, [currentYear])

  const { startDate, endDate, months, dailyDataMonths, yearCompare } = useMemo(() => {
    switch (period) {
      case PeriodType.Month:
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 1,
          dailyDataMonths: [currentMonth],
          yearCompare: null,
        }
      case PeriodType.ThreeMonth:
        return {
          startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 3,
          dailyDataMonths: [],
          yearCompare: null,
        }
      case PeriodType.SixMonth:
        return {
          startDate: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 6,
          dailyDataMonths: [],
          yearCompare: null,
        }
      case PeriodType.Year:
        return {
          startDate: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 12,
          dailyDataMonths: [],
          yearCompare: null,
        }
      case PeriodType.MonthCompare:
        return {
          startDate: format(startOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 2,
          dailyDataMonths: [monthCompareTarget, currentMonth],
          yearCompare: null,
        }
      case PeriodType.YearCompare:
        return {
          startDate: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 12,
          dailyDataMonths: [],
          yearCompare: { currentYear, compareYear: yearCompareTarget },
        }
      default:
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 1,
          dailyDataMonths: [currentMonth],
          yearCompare: null,
        }
    }
  }, [period, now, currentMonth, currentYear, monthCompareTarget, yearCompareTarget])

  const isDailyView = period === PeriodType.Month
  const isMonthCompare = period === PeriodType.MonthCompare
  const isYearCompare = period === PeriodType.YearCompare
  const isMonthlyView = [PeriodType.ThreeMonth, PeriodType.SixMonth, PeriodType.Year].includes(period)

  // Queries — T-M31: 统一加 staleTime 避免重复请求
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['statistics', 'monthly-trend', months, endDate],
    queryFn: () => fetchMonthlyTrend({ months, endDate, type: 'expense' }),
    enabled: !isDailyView && !isMonthCompare && !isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const dailySummaryQueries = useQuery({
    queryKey: ['statistics', 'daily-summary', dailyDataMonths],
    queryFn: async () => {
      const results = await Promise.all(
        dailyDataMonths.map((month) => fetchDailySummary({ month })),
      )
      return results
    },
    enabled: isDailyView || isMonthCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: yoyExpenseData = [], isLoading: yoyExpenseLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear, 'expense'],
    queryFn: () => fetchYearOverYear({ year: yearCompare?.currentYear, compareYear: yearCompare?.compareYear, type: 'expense' }),
    enabled: isYearCompare && !!yearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: yoyIncomeData = [], isLoading: yoyIncomeLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear, 'income'],
    queryFn: () => fetchYearOverYear({ year: yearCompare?.currentYear, compareYear: yearCompare?.compareYear, type: 'income' }),
    enabled: isYearCompare && !!yearCompare,
    staleTime: 5 * 60 * 1000,
  })

  // Date ranges for category breakdown
  const currentMonthRange = useMemo(() => ({
    startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
  }), [now])

  const targetMonthRange = useMemo(() => ({
    startDate: format(startOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
  }), [monthCompareTarget])

  const currentYearRange = useMemo(() => {
    const currentEnd = new Date(currentYear, now.getMonth(), 1)
    return {
      startDate: format(startOfMonth(subMonths(currentEnd, 11)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(currentEnd), 'yyyy-MM-dd'),
    }
  }, [currentYear, now])

  const targetYearRange = useMemo(() => {
    const compareEnd = new Date(yearCompareTarget, now.getMonth(), 1)
    return {
      startDate: format(startOfMonth(subMonths(compareEnd, 11)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(compareEnd), 'yyyy-MM-dd'),
    }
  }, [yearCompareTarget, now])

  // Category breakdown queries — T-M31: 加 staleTime
  const { data: expenseBreakdown = [], isLoading: expenseBreakdownLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', startDate, endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'expense' }),
    enabled: !isMonthCompare && !isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: incomeBreakdown = [], isLoading: incomeBreakdownLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', startDate, endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'income' }),
    enabled: !isMonthCompare && !isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: currentMonthExpense = [], isLoading: currentMonthExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentMonthRange.startDate, currentMonthRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentMonthRange.startDate, endDate: currentMonthRange.endDate, type: 'expense' }),
    enabled: isMonthCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: currentMonthIncome = [], isLoading: currentMonthIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentMonthRange.startDate, currentMonthRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentMonthRange.startDate, endDate: currentMonthRange.endDate, type: 'income' }),
    enabled: isMonthCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: targetMonthExpense = [], isLoading: targetMonthExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetMonthRange.startDate, targetMonthRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetMonthRange.startDate, endDate: targetMonthRange.endDate, type: 'expense' }),
    enabled: isMonthCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: targetMonthIncome = [], isLoading: targetMonthIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetMonthRange.startDate, targetMonthRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetMonthRange.startDate, endDate: targetMonthRange.endDate, type: 'income' }),
    enabled: isMonthCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: currentYearExpense = [], isLoading: currentYearExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentYearRange.startDate, currentYearRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentYearRange.startDate, endDate: currentYearRange.endDate, type: 'expense' }),
    enabled: isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: currentYearIncome = [], isLoading: currentYearIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentYearRange.startDate, currentYearRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentYearRange.startDate, endDate: currentYearRange.endDate, type: 'income' }),
    enabled: isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: targetYearExpense = [], isLoading: targetYearExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetYearRange.startDate, targetYearRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetYearRange.startDate, endDate: targetYearRange.endDate, type: 'expense' }),
    enabled: isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  const { data: targetYearIncome = [], isLoading: targetYearIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetYearRange.startDate, targetYearRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetYearRange.startDate, endDate: targetYearRange.endDate, type: 'income' }),
    enabled: isYearCompare,
    staleTime: 5 * 60 * 1000,
  })

  // Merge and sort breakdown data
  const mergeSorted = (exp: CategoryBreakdownItem[], inc: CategoryBreakdownItem[]): MergedBreakdownItem[] => {
    const merged: MergedBreakdownItem[] = [
      ...exp.map((d) => ({ ...d, type: 'expense' as const })),
      ...inc.map((d) => ({ ...d, type: 'income' as const })),
    ]
    return merged.sort((a, b) => Number(b.amount) - Number(a.amount))
  }

  const mergedDefaultBreakdown = useMemo(() => mergeSorted(expenseBreakdown, incomeBreakdown), [expenseBreakdown, incomeBreakdown])
  const currentMonthMerged = useMemo(() => mergeSorted(currentMonthExpense, currentMonthIncome), [currentMonthExpense, currentMonthIncome])
  const targetMonthMerged = useMemo(() => mergeSorted(targetMonthExpense, targetMonthIncome), [targetMonthExpense, targetMonthIncome])
  const currentYearMerged = useMemo(() => mergeSorted(currentYearExpense, currentYearIncome), [currentYearExpense, currentYearIncome])
  const targetYearMerged = useMemo(() => mergeSorted(targetYearExpense, targetYearIncome), [targetYearExpense, targetYearIncome])

  const totalExpense = useMemo(() => {
    return expenseBreakdown.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [expenseBreakdown])

  const totalIncome = useMemo(() => {
    return incomeBreakdown.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }, [incomeBreakdown])

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
