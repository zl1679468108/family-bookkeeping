import React, { useState, useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns'
import { fetchMonthlyTrend, fetchCategoryBreakdown, fetchDailySummary, fetchYearOverYear } from '../../services/statisticsApi'
import { useBook } from '../../hooks/useBook'
import { useMemberColors } from '../../hooks/useMemberColors'
import { formatAmount } from '../../utils/common'
import { Card, CardHeader } from '../../components/ui/Card'
import { SegControl } from '../../components/ui/SegControl'
import { DropdownSelect } from '../../components/ui/Dropdown'

import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import MemberComparison from './MemberComparison'
import type { CategoryBreakdownItem } from '../../types/statistics'

// 日期范围枚举
enum PeriodType {
  Month = 'month',
  ThreeMonth = '3month',
  SixMonth = '6month',
  Year = 'year',
  MonthCompare = 'monthCompare',
  YearCompare = 'yearCompare',
}

const Reports: React.FC = () => {
  const { currentBook } = useBook()
  const { isMultiMember } = useMemberColors(currentBook?.id)
  const [tab, setTab] = useState<'analysis' | 'members'>('analysis')

  const [period, setPeriod] = useState<PeriodType>(PeriodType.Month)

  // 月对比：当前月份（固定）和对比月份（可选）
  const [monthCompareTarget, setMonthCompareTarget] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'))

  // 年对比：当前年份（固定）和对比年份（可选）
  const [yearCompareTarget, setYearCompareTarget] = useState(new Date().getFullYear() - 1)

  // 成员对比的独立月份范围
  const [memberStartMonth, setMemberStartMonth] = useState(format(subMonths(new Date(), 11), 'yyyy-MM'))
  const [memberEndMonth, setMemberEndMonth] = useState(format(new Date(), 'yyyy-MM'))

  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const currentYear = now.getFullYear()

  // 图表引用
  const mainChartRef = useRef<HTMLDivElement>(null)
  const mainChartInstance = useRef<echarts.ECharts | null>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)
  const pieChartInstance = useRef<echarts.ECharts | null>(null)
  const pieChart2Ref = useRef<HTMLDivElement>(null)
  const pieChart2Instance = useRef<echarts.ECharts | null>(null)

  // 生成 ±5 年的年份选项
  const yearOptions = useMemo(() => {
    const years: { key: string; label: string }[] = []
    for (let i = -5; i <= 5; i++) {
      const y = currentYear + i
      years.push({ key: String(y), label: `${y}年` })
    }
    return years
  }, [currentYear])

  // 生成 ±5 年范围的月份选项（key 为 yyyy-MM 格式）
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

  // 根据周期计算日期范围和参数
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

  // 获取月度趋势数据
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['statistics', 'monthly-trend', months, endDate],
    queryFn: () => fetchMonthlyTrend({ months, endDate, type: 'expense' }),
    enabled: !isDailyView && !isMonthCompare && !isYearCompare,
  })

  // 获取每日汇总数据
  const dailySummaryQueries = useQuery({
    queryKey: ['statistics', 'daily-summary', dailyDataMonths],
    queryFn: async () => {
      const results = await Promise.all(
        dailyDataMonths.map((month) => fetchDailySummary({ month })),
      )
      return results
    },
    enabled: isDailyView || isMonthCompare,
  })

  // 获取年度对比数据
  const { data: yoyExpenseData = [], isLoading: yoyExpenseLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear, 'expense'],
    queryFn: () =>
      fetchYearOverYear({
        year: yearCompare?.currentYear,
        compareYear: yearCompare?.compareYear,
        type: 'expense',
      }),
    enabled: isYearCompare && !!yearCompare,
  })

  const { data: yoyIncomeData = [], isLoading: yoyIncomeLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear, 'income'],
    queryFn: () =>
      fetchYearOverYear({
        year: yearCompare?.currentYear,
        compareYear: yearCompare?.compareYear,
        type: 'income',
      }),
    enabled: isYearCompare && !!yearCompare,
  })

  // —— 默认范围的分类排行
  const currentMonthRange = useMemo(
    () => ({
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    }),
    [now],
  )

  const targetMonthRange = useMemo(
    () => ({
      startDate: format(startOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
    }),
    [monthCompareTarget],
  )

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

  const { data: expenseBreakdown = [], isLoading: expenseBreakdownLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', startDate, endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'expense' }),
    enabled: !isMonthCompare && !isYearCompare,
  })

  const { data: incomeBreakdown = [], isLoading: incomeBreakdownLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', startDate, endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'income' }),
    enabled: !isMonthCompare && !isYearCompare,
  })

  const { data: currentMonthExpense = [], isLoading: currentMonthExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentMonthRange.startDate, currentMonthRange.endDate, 'expense'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: currentMonthRange.startDate,
        endDate: currentMonthRange.endDate,
        type: 'expense',
      }),
    enabled: isMonthCompare,
  })
  const { data: currentMonthIncome = [], isLoading: currentMonthIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentMonthRange.startDate, currentMonthRange.endDate, 'income'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: currentMonthRange.startDate,
        endDate: currentMonthRange.endDate,
        type: 'income',
      }),
    enabled: isMonthCompare,
  })

  const { data: targetMonthExpense = [], isLoading: targetMonthExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetMonthRange.startDate, targetMonthRange.endDate, 'expense'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: targetMonthRange.startDate,
        endDate: targetMonthRange.endDate,
        type: 'expense',
      }),
    enabled: isMonthCompare,
  })
  const { data: targetMonthIncome = [], isLoading: targetMonthIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetMonthRange.startDate, targetMonthRange.endDate, 'income'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: targetMonthRange.startDate,
        endDate: targetMonthRange.endDate,
        type: 'income',
      }),
    enabled: isMonthCompare,
  })

  const { data: currentYearExpense = [], isLoading: currentYearExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentYearRange.startDate, currentYearRange.endDate, 'expense'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: currentYearRange.startDate,
        endDate: currentYearRange.endDate,
        type: 'expense',
      }),
    enabled: isYearCompare,
  })
  const { data: currentYearIncome = [], isLoading: currentYearIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentYearRange.startDate, currentYearRange.endDate, 'income'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: currentYearRange.startDate,
        endDate: currentYearRange.endDate,
        type: 'income',
      }),
    enabled: isYearCompare,
  })

  const { data: targetYearExpense = [], isLoading: targetYearExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetYearRange.startDate, targetYearRange.endDate, 'expense'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: targetYearRange.startDate,
        endDate: targetYearRange.endDate,
        type: 'expense',
      }),
    enabled: isYearCompare,
  })
  const { data: targetYearIncome = [], isLoading: targetYearIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetYearRange.startDate, targetYearRange.endDate, 'income'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: targetYearRange.startDate,
        endDate: targetYearRange.endDate,
        type: 'income',
      }),
    enabled: isYearCompare,
  })

  type MergedBreakdownItem = CategoryBreakdownItem & { type: 'expense' | 'income' }

  const mergeSorted = (
    exp: CategoryBreakdownItem[],
    inc: CategoryBreakdownItem[],
  ): MergedBreakdownItem[] => {
    const merged: MergedBreakdownItem[] = [
      ...exp.map((d) => ({ ...d, type: 'expense' as const })),
      ...inc.map((d) => ({ ...d, type: 'income' as const })),
    ]
    return merged.sort((a, b) => Number(b.amount) - Number(a.amount))
  }

  const mergedDefaultBreakdown = useMemo(
    () => mergeSorted(expenseBreakdown, incomeBreakdown),
    [expenseBreakdown, incomeBreakdown],
  )

  const currentMonthMerged = useMemo(
    () => mergeSorted(currentMonthExpense, currentMonthIncome),
    [currentMonthExpense, currentMonthIncome],
  )
  const targetMonthMerged = useMemo(
    () => mergeSorted(targetMonthExpense, targetMonthIncome),
    [targetMonthExpense, targetMonthIncome],
  )

  const currentYearMerged = useMemo(
    () => mergeSorted(currentYearExpense, currentYearIncome),
    [currentYearExpense, currentYearIncome],
  )
  const targetYearMerged = useMemo(
    () => mergeSorted(targetYearExpense, targetYearIncome),
    [targetYearExpense, targetYearIncome],
  )

  // 处理每日数据
  const dailyData = useMemo(() => {
    if (!dailySummaryQueries.data || !isDailyView) return []
    return dailySummaryQueries.data[0] || []
  }, [dailySummaryQueries.data, isDailyView])

  // 处理月对比数据
  const monthCompareData = useMemo(() => {
    if (!dailySummaryQueries.data || !isMonthCompare) return { targetMonth: [], currentMonth: [] }
    return {
      targetMonth: dailySummaryQueries.data[0] || [],
      currentMonth: dailySummaryQueries.data[1] || [],
    }
  }, [dailySummaryQueries.data, isMonthCompare])

  // 图表加载状态
  const mainLoading = trendLoading || dailySummaryQueries.isLoading || yoyExpenseLoading || yoyIncomeLoading

  // 初始化主图表
  useEffect(() => {
    if (!mainChartRef.current) return

    if (mainChartInstance.current) {
      mainChartInstance.current.dispose()
      mainChartInstance.current = null
    }
    mainChartInstance.current = echarts.init(mainChartRef.current)

    let option: echarts.EChartsOption = {}

    if (isDailyView && dailyData.length > 0) {
      const dates = dailyData.map((d) => `${parseInt(d.date.slice(8, 10), 10)}日`)
      const expenses = dailyData.map((d) => Number(d.total_expense || 0))
      const incomes = dailyData.map((d) => Number(d.total_income || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const expense = params.find((p: any) => p.seriesName === '总支出')?.value || 0
            const income = params.find((p: any) => p.seriesName === '总收入')?.value || 0
            return `${params[0].name}<br/>总支出：${formatAmount(expense)}<br/>总收入：${formatAmount(income)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: dates },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value: number) => formatAmount(value) },
        },
        legend: { data: ['总支出', '总收入'], top: 5 },
        series: [
          { name: '总支出', type: 'bar', data: expenses, itemStyle: { color: '#e74c3c' } },
          { name: '总收入', type: 'bar', data: incomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    } else if (isMonthCompare) {
      const maxDays = Math.max(monthCompareData.currentMonth.length, monthCompareData.targetMonth.length)
      const dates = Array.from({ length: maxDays }, (_, i) => `${i + 1}日`)

      const currExpenses = monthCompareData.currentMonth.map((d) => Number(d.total_expense || 0))
      const currIncomes = monthCompareData.currentMonth.map((d) => Number(d.total_income || 0))
      const targetExpenses = monthCompareData.targetMonth.map((d) => Number(d.total_expense || 0))
      const targetIncomes = monthCompareData.targetMonth.map((d) => Number(d.total_income || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const currExp = params.find((p: any) => p.seriesName === `${format(now, 'yyyy 年 MM 月')} 总支出`)?.value || 0
            const currInc = params.find((p: any) => p.seriesName === `${format(now, 'yyyy 年 MM 月')} 总收入`)?.value || 0
            const targetExp = params.find((p: any) => p.seriesName === `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 总支出`)?.value || 0
            const targetInc = params.find((p: any) => p.seriesName === `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 总收入`)?.value || 0
            return `${params[0].name}<br/>
              ${format(now, 'yyyy 年 MM 月')} 总支出：${formatAmount(currExp)}<br/>
              ${format(now, 'yyyy 年 MM 月')} 总收入：${formatAmount(currInc)}<br/>
              ${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 总支出：${formatAmount(targetExp)}<br/>
              ${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 总收入：${formatAmount(targetInc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: dates },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value: number) => formatAmount(value) },
        },
        legend: { top: 5 },
        series: [
          { name: `${format(now, 'yyyy 年 MM 月')} 总支出`, type: 'bar', data: currExpenses, itemStyle: { color: '#c0392b' }, barGap: '20%' },
          { name: `${format(now, 'yyyy 年 MM 月')} 总收入`, type: 'bar', data: currIncomes, itemStyle: { color: '#1e8449' } },
          { name: `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 总支出`, type: 'bar', data: targetExpenses, itemStyle: { color: '#e74c3c' } },
          { name: `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 总收入`, type: 'bar', data: targetIncomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    } else if (isYearCompare && yoyExpenseData.length > 0 && yoyIncomeData.length > 0) {
      const monthLabels = yoyExpenseData.map((d) => d.monthLabel)
      const currentYearExpenses = yoyExpenseData.map((d) => Number(d.currentYear || 0))
      const targetYearExpenses = yoyExpenseData.map((d) => Number(d.lastYear || 0))
      const currentYearIncomes = yoyIncomeData.map((d) => Number(d.currentYear || 0))
      const targetYearIncomes = yoyIncomeData.map((d) => Number(d.lastYear || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const currExp = params.find((p: any) => p.seriesName === `${currentYear}年 总支出`)?.value || 0
            const currInc = params.find((p: any) => p.seriesName === `${currentYear}年 总收入`)?.value || 0
            const targetExp = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 总支出`)?.value || 0
            const targetInc = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 总收入`)?.value || 0
            return `${params[0].name}<br/>
              ${currentYear}年 总支出：${formatAmount(currExp)}<br/>
              ${currentYear}年 总收入：${formatAmount(currInc)}<br/>
              ${yearCompareTarget}年 总支出：${formatAmount(targetExp)}<br/>
              ${yearCompareTarget}年 总收入：${formatAmount(targetInc)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: monthLabels },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value: number) => formatAmount(value) },
        },
        legend: { top: 5 },
        series: [
          { name: `${currentYear}年 总支出`, type: 'bar', data: currentYearExpenses, itemStyle: { color: '#c0392b' }, barGap: '20%' },
          { name: `${currentYear}年 总收入`, type: 'bar', data: currentYearIncomes, itemStyle: { color: '#1e8449' } },
          { name: `${yearCompareTarget}年 总支出`, type: 'bar', data: targetYearExpenses, itemStyle: { color: '#e74c3c' } },
          { name: `${yearCompareTarget}年 总收入`, type: 'bar', data: targetYearIncomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    } else if (isMonthlyView && trendData.length > 0) {
      const monthLabels = trendData.map((d) => d.month.slice(5) + '月')
      const expenses = trendData.map((d) => Number(d.expense || 0))
      const incomes = trendData.map((d) => Number(d.income || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const expense = params.find((p: any) => p.seriesName === '总支出')?.value || 0
            const income = params.find((p: any) => p.seriesName === '总收入')?.value || 0
            return `${params[0].name}<br/>总支出：${formatAmount(expense)}<br/>总收入：${formatAmount(income)}`
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
        xAxis: { type: 'category', data: monthLabels },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: (value: number) => formatAmount(value) },
        },
        legend: { data: ['总支出', '总收入'], top: 5 },
        series: [
          { name: '总支出', type: 'bar', data: expenses, itemStyle: { color: '#e74c3c' } },
          { name: '总收入', type: 'bar', data: incomes, itemStyle: { color: '#27ae60' } },
        ],
      }
    }

    if (mainChartInstance.current) {
      mainChartInstance.current.setOption(option as any)
      mainChartInstance.current.resize()
    }

    const handleResize = () => {
      mainChartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [period, dailyData, monthCompareData, yoyExpenseData, yoyIncomeData, trendData, currentMonth, currentYear, monthCompareTarget, yearCompareTarget, now, mainLoading])

  // 分类排行加载状态
  const categoryLoading = isMonthCompare
    ? currentMonthExpenseLoading || currentMonthIncomeLoading || targetMonthExpenseLoading || targetMonthIncomeLoading
    : isYearCompare
      ? currentYearExpenseLoading || currentYearIncomeLoading || targetYearExpenseLoading || targetYearIncomeLoading
      : expenseBreakdownLoading || incomeBreakdownLoading

  // 初始化扇形图 - 分类排行
  const renderPieChart = (
    elRef: React.RefObject<HTMLDivElement>,
    instRef: React.MutableRefObject<echarts.ECharts | null>,
    data: MergedBreakdownItem[],
  ) => {
    if (!elRef.current) return

    if (instRef.current) {
      instRef.current.dispose()
      instRef.current = null
    }
    instRef.current = echarts.init(elRef.current)

    const pieData = data.map((d) => ({
      name: d.category_name,
      value: Number(d.amount),
    }))

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const v = params.value || 0
          return `${params.name}<br/>金额：${formatAmount(v)}<br/>占比：${params.percent}%`
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { fontSize: 12, color: 'var(--fg)' },
      },
      series: [
        {
          name: '分类占比',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: 'var(--bg-card)',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 11,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: pieData,
        },
      ],
    }

    instRef.current.setOption(option as any)
    instRef.current.resize()
  }

  // 渲染默认分类扇形图
  useEffect(() => {
    if (categoryLoading || mergedDefaultBreakdown.length === 0) return
    if (isMonthCompare || isYearCompare) return
    if (!pieChartRef.current) return

    // 延迟一点等 DOM 挂载完成
    const timer = setTimeout(() => {
      renderPieChart(pieChartRef, pieChartInstance, mergedDefaultBreakdown)
    }, 50)

    const handleResize = () => pieChartInstance.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [mergedDefaultBreakdown, categoryLoading, isMonthCompare, isYearCompare, period])

  // 渲染对比模式的两个扇形图
  useEffect(() => {
    if (categoryLoading) return
    if (!isMonthCompare && !isYearCompare) return

    const data1 = isMonthCompare ? currentMonthMerged : currentYearMerged
    const data2 = isMonthCompare ? targetMonthMerged : targetYearMerged

    if (data1.length === 0 && data2.length === 0) return

    const timer = setTimeout(() => {
      if (data1.length > 0 && pieChartRef.current) {
        renderPieChart(pieChartRef, pieChartInstance, data1)
      }
      if (data2.length > 0 && pieChart2Ref.current) {
        renderPieChart(pieChart2Ref, pieChart2Instance, data2)
      }
    }, 50)

    const handleResize = () => {
      pieChartInstance.current?.resize()
      pieChart2Instance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [currentMonthMerged, targetMonthMerged, currentYearMerged, targetYearMerged, categoryLoading, isMonthCompare, isYearCompare, period])

  const periodOptions = [
    { value: PeriodType.Month, label: '本月' },
    { value: PeriodType.ThreeMonth, label: '近 3 月' },
    { value: PeriodType.SixMonth, label: '近 6 月' },
    { value: PeriodType.Year, label: '近 1 年' },
    { value: PeriodType.MonthCompare, label: '月对比' },
    { value: PeriodType.YearCompare, label: '年对比' },
  ] as const

  const chartHasData = (() => {
    if (isDailyView) return dailyData.length > 0
    if (isMonthlyView) return trendData.length > 0
    if (isMonthCompare) return monthCompareData.currentMonth.length > 0 || monthCompareData.targetMonth.length > 0
    if (isYearCompare) return yoyExpenseData.length > 0 || yoyIncomeData.length > 0
    return false
  })()

  const chartTitle = (() => {
    if (isDailyView) return '本月每日总支出/总收入'
    if (isMonthlyView) return '月度总支出/总收入汇总'
    if (isMonthCompare) return '月对比'
    if (isYearCompare) return '年对比'
    return ''
  })()

  const chartAction = (() => {
    if (isMonthCompare) {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>
            {format(now, 'yyyy 年 MM 月')}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
          <DropdownSelect
            options={monthOptions}
            value={monthCompareTarget}
            onChange={(key) => key && setMonthCompareTarget(key)}
            showSearch
            searchPlaceholder="搜索月份..."
          />
        </div>
      )
    }
    if (isYearCompare) {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>
            {currentYear}年
          </span>
          <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
          <DropdownSelect
            options={yearOptions}
            value={String(yearCompareTarget)}
            onChange={(key) => key && setYearCompareTarget(Number(key))}
            showSearch
            searchPlaceholder="搜索年份..."
          />
        </div>
      )
    }
    return null
  })()

  const rankTitle = (() => {
    if (isDailyView) return <>分类排行 <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--fg3)' }}>（本月）</span></>
    if (isMonthlyView) return <>分类排行 <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--fg3)' }}>（近{months}个月）</span></>
    if (isMonthCompare) return <>分类排行 <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--fg3)' }}>（{format(now, 'yyyy 年 MM 月')} vs {format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')}）</span></>
    if (isYearCompare) return <>分类排行 <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--fg3)' }}>（{currentYear}年 vs {yearCompareTarget}年）</span></>
    return <>分类排行</>
  })()

  const rankEmptyText = (() => {
    if (isDailyView) return '本月暂无分类数据'
    if (isMonthlyView) return `近${months}个月暂无分类数据`
    if (isMonthCompare) return '暂无对比月份的分类数据'
    if (isYearCompare) return '暂无对比年份的分类数据'
    return '暂无数据'
  })()

  return (
    <div className="page-container">
      {/* Tab 切换 */}
      <SegControl
        options={[
          { value: 'analysis', label: '数据分析' },
          { value: 'members', label: '成员对比' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'analysis' | 'members')}
      />

      {tab === 'analysis' && (
        <>
          {/* 时间周期选择 */}
          <div>
            {mainLoading ? (
              <div className="seg-control" style={{ pointerEvents: 'none' }}>
                {periodOptions.map((opt, i) => (
                  <Skeleton
                    key={i}
                    width={String(opt.label).length * 14 + 28}
                    height="26px"
                    borderRadius="calc(var(--rs) - 3px)"
                  />
                ))}
              </div>
            ) : (
              <SegControl
                options={periodOptions as unknown as { value: string; label: React.ReactNode }[]}
                value={period}
                onChange={(v) => setPeriod(v as PeriodType)}
              />
            )}
          </div>

          {/* 上方：趋势图表 */}
          <Card style={{ marginTop: '14px' }}>
            {mainLoading ? (
              <>
                <CardHeader
                  title={<Skeleton width="45%" height="16px" />}
                  action={
                    (isMonthCompare || isYearCompare) ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Skeleton width="100px" height="14px" />
                        <Skeleton width="20px" height="12px" />
                        <Skeleton width="120px" height="28px" borderRadius="var(--rs)" />
                      </div>
                    ) : null
                  }
                />
                <Skeleton width="100%" height="300px" borderRadius="var(--rs)" />
              </>
            ) : (
              <>
                <CardHeader title={chartTitle} action={chartAction} />
                <div ref={mainChartRef} style={{ width: '100%', height: '300px' }} />
                {!chartHasData && (
                  <div style={{
                    position: 'relative',
                    marginTop: '-300px',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    background: 'var(--bg-card)',
                  }}>
                    <EmptyState
                      icon="📊"
                      title="暂无数据"
                      description="当前时间段内没有交易记录"
                      action={<Button variant="outline">开始记账</Button>}
                    />
                  </div>
                )}
              </>
            )}
          </Card>

          {/* 下方：分类排行 - 扇形图 */}
          <Card style={{ marginTop: '14px' }}>
            {categoryLoading ? (
              <>
                <CardHeader title={<Skeleton width="35%" height="16px" />} />
                <Skeleton width="100%" height="300px" borderRadius="var(--rs)" />
              </>
            ) : (
              <>
                <CardHeader title={rankTitle} />
                {isMonthCompare || isYearCompare ? (
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fg)', marginBottom: '10px' }}>
                        {isMonthCompare ? format(now, 'yyyy 年 MM 月') : `${currentYear}年`}
                      </div>
                      {(isMonthCompare ? currentMonthMerged : currentYearMerged).length > 0 ? (
                        <div ref={pieChartRef} style={{ width: '100%', height: '300px' }} />
                      ) : (
                        <EmptyState variant="compact" icon="📭" title="暂无数据" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fg)', marginBottom: '10px' }}>
                        {isMonthCompare ? format(parseISO(monthCompareTarget), 'yyyy 年 MM 月') : `${yearCompareTarget}年`}
                      </div>
                      {(isMonthCompare ? targetMonthMerged : targetYearMerged).length > 0 ? (
                        <div ref={pieChart2Ref} style={{ width: '100%', height: '300px' }} />
                      ) : (
                        <EmptyState variant="compact" icon="📭" title="暂无数据" />
                      )}
                    </div>
                  </div>
                ) : mergedDefaultBreakdown.length > 0 ? (
                  <div ref={pieChartRef} style={{ width: '100%', height: '300px' }} />
                ) : (
                  <EmptyState variant="compact" icon="📭" title={rankEmptyText} description="请等待数据加载或切换其他时间段" />
                )}
              </>
            )}
          </Card>
        </>
      )}

      {tab === 'members' && (
        <>
          {!isMultiMember ? (
            <Card>
              <EmptyState
                icon="👥"
                title="单成员账本"
                description="成员对比功能仅在多成员账本中可用，请切换至其他账本或邀请家人加入"
              />
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--fg2)' }}>时间范围</span>
                <DropdownSelect
                  options={monthOptions}
                  value={memberStartMonth}
                  onChange={(key) => key && setMemberStartMonth(key)}
                  showSearch
                  searchPlaceholder="搜索月份..."
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg3)' }}>至</span>
                <DropdownSelect
                  options={monthOptions}
                  value={memberEndMonth}
                  onChange={(key) => key && setMemberEndMonth(key)}
                  showSearch
                  searchPlaceholder="搜索月份..."
                />
              </div>

              {currentBook?.id ? (
                <MemberComparison bookId={currentBook.id} monthFrom={memberStartMonth} monthTo={memberEndMonth} />
              ) : (
                <Card>
                  <EmptyState
                    icon="📒"
                    title="请先选择一个账本"
                    description="在左侧账本列表中选择要查看的账本"
                  />
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Reports
