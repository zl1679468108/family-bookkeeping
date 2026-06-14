import React, { useState, useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns'
import { fetchMonthlyTrend, fetchCategoryBreakdown, fetchDailySummary, fetchYearOverYear } from '../../services/statisticsApi'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useBook } from '../../hooks/useBook'
import { formatAmount } from '../../utils/common'
import { Skeleton } from '../../components/ui/Skeleton'
import MemberComparison from './MemberComparison'
import type { CategoryBreakdownItem } from '../../types/statistics'

// 排行列表组件：收入和支出合并排序，各自保留颜色区分
type RankListItem = CategoryBreakdownItem & { type: 'expense' | 'income' }

function RankList({
  items,
  getCategoryIcon,
  getCategoryName,
}: {
  items: RankListItem[]
  getCategoryIcon: (id: string) => React.ReactNode
  getCategoryName: (id: string) => string
}) {
  if (items.length === 0) {
    return <div style={{ fontSize: '12px', color: 'var(--fg3)', padding: '12px 0' }}>暂无数据</div>
  }
  const total = items.reduce((s, d) => s + Number(d.amount), 0)
  return (
    <>
      {items.map((item) => {
        const amount = Number(item.amount)
        const pct = total > 0 ? (amount / total) * 100 : 0
        const colorVar = item.type === 'expense' ? 'var(--exp)' : 'var(--inc)'
        return (
          <div key={`${item.type}-${item.category_id}`} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {getCategoryIcon(item.category_id)} {getCategoryName(item.category_id)}
                <span style={{ marginLeft: '6px', fontSize: '11px', color: colorVar, fontWeight: 500 }}>
                  {item.type === 'expense' ? '支' : '收'}
                </span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: colorVar }}>
                {formatAmount(amount)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: colorVar, borderRadius: 2, transition: 'width 0.35s' }} />
            </div>
          </div>
        )
      })}
    </>
  )
}

const Reports: React.FC = () => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()
  const { currentBook } = useBook()

  // Tab 切换: analysis = 数据分析, members = 成员对比
  const [tab, setTab] = useState<'analysis' | 'members'>('analysis')

  // 成员对比月份范围
  const [mcMonthFrom, setMcMonthFrom] = useState(format(subMonths(new Date(), 2), 'yyyy-MM'))
  const [mcMonthTo, setMcMonthTo] = useState(format(new Date(), 'yyyy-MM'))

  const [period, setPeriod] = useState<'month' | '3month' | '6month' | 'year' | 'monthCompare' | 'yearCompare'>('month')
  
  // 月对比：当前月份（固定）和对比月份（可选）
  const [monthCompareTarget, setMonthCompareTarget] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'))
  
  // 年对比：当前年份（固定）和对比年份（可选）
  const [yearCompareTarget, setYearCompareTarget] = useState(new Date().getFullYear() - 1)

  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const currentYear = now.getFullYear()

  // 图表引用
  const mainChartRef = useRef<HTMLDivElement>(null)
  let mainChartInstance: echarts.ECharts | null = null

  // 生成 10 年内的年份选项（当前年份往前推 10 年）
  const yearOptions = useMemo(() => {
    const years = []
    for (let i = 0; i <= 10; i++) {
      years.push(currentYear - i)
    }
    return years
  }, [currentYear])

  // 生成 12 个月选项
  const monthOptions = useMemo(() => {
    const months = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), i, 1)
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'yyyy 年 MM 月')
      })
    }
    return months
  }, [now])

  // 根据周期计算日期范围和参数
  const { startDate, endDate, months, dailyDataMonths, yearCompare } = useMemo(() => {
    switch (period) {
      case 'month': 
        return { 
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 1,
          dailyDataMonths: [currentMonth],
          yearCompare: null
        }
      case '3month': 
        return { 
          startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 3,
          dailyDataMonths: [],
          yearCompare: null
        }
      case '6month': 
        return { 
          startDate: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 6,
          dailyDataMonths: [],
          yearCompare: null
        }
      case 'year': 
        return { 
          startDate: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 12,
          dailyDataMonths: [],
          yearCompare: null
        }
      case 'monthCompare': 
        return { 
          startDate: format(startOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 2,
          dailyDataMonths: [monthCompareTarget, currentMonth],
          yearCompare: null
        }
      case 'yearCompare': 
        return { 
          startDate: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 12,
          dailyDataMonths: [],
          yearCompare: { currentYear, compareYear: yearCompareTarget }
        }
      default: 
        return { 
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'), 
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
          months: 1,
          dailyDataMonths: [currentMonth],
          yearCompare: null
        }
    }
  }, [period, now, currentMonth, currentYear, monthCompareTarget, yearCompareTarget])

  const isDailyView = period === 'month'
  const isMonthCompare = period === 'monthCompare'
  const isYearCompare = period === 'yearCompare'
  const isMonthlyView = ['3month', '6month', 'year'].includes(period)

  // 获取月度趋势数据（用于月度汇总视图）
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['statistics', 'monthly-trend', months, endDate],
    queryFn: () => fetchMonthlyTrend({ months, endDate, type: 'expense' }),
    enabled: !isDailyView && !isMonthCompare && !isYearCompare,
  })

  // 获取每日汇总数据（用于本月视图和月对比视图）
  const dailySummaryQueries = useQuery({
    queryKey: ['statistics', 'daily-summary', dailyDataMonths],
    queryFn: async () => {
      const results = await Promise.all(
        dailyDataMonths.map(month => fetchDailySummary({ month }))
      )
      return results
    },
    enabled: isDailyView || isMonthCompare,
  })

  // 获取年度对比数据（支出）
  const { data: yoyExpenseData = [], isLoading: yoyExpenseLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear, 'expense'],
    queryFn: () => fetchYearOverYear({
      year: yearCompare?.currentYear,
      compareYear: yearCompare?.compareYear,
      type: 'expense'
    }),
    enabled: isYearCompare && !!yearCompare,
  })

  // 获取年度对比数据（收入）
  const { data: yoyIncomeData = [], isLoading: yoyIncomeLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear, 'income'],
    queryFn: () => fetchYearOverYear({
      year: yearCompare?.currentYear,
      compareYear: yearCompare?.compareYear,
      type: 'income'
    }),
    enabled: isYearCompare && !!yearCompare,
  })

  // --- 分类排行：对比模式下按「期」拉取，其他模式按全局范围拉取 ---

  // 月对比：当期月份
  const currentMonthRange = useMemo(() => ({
    startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
  }), [now])

  // 月对比：对比期月份
  const targetMonthRange = useMemo(() => ({
    startDate: format(startOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(parseISO(monthCompareTarget)), 'yyyy-MM-dd'),
  }), [monthCompareTarget])

  // 年对比：当期年（最近 12 个月以当前月份为终点）
  const currentYearRange = useMemo(() => ({
    startDate: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
  }), [now])

  // 年对比：对比年（以对比年的当前月份结束的 12 个月）
  const targetYearRange = useMemo(() => {
    const compareEnd = new Date(yearCompareTarget, now.getMonth(), 1)
    return {
      startDate: format(startOfMonth(subMonths(compareEnd, 11)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(compareEnd), 'yyyy-MM-dd'),
    }
  }, [yearCompareTarget, now])

  // 默认模式下全局范围（支出/收入）
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

  // 月对比 - 当期月（支出+收入）
  const { data: currentMonthExpense = [], isLoading: currentMonthExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentMonthRange.startDate, currentMonthRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentMonthRange.startDate, endDate: currentMonthRange.endDate, type: 'expense' }),
    enabled: isMonthCompare,
  })
  const { data: currentMonthIncome = [], isLoading: currentMonthIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentMonthRange.startDate, currentMonthRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentMonthRange.startDate, endDate: currentMonthRange.endDate, type: 'income' }),
    enabled: isMonthCompare,
  })

  // 月对比 - 对比月（支出+收入）
  const { data: targetMonthExpense = [], isLoading: targetMonthExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetMonthRange.startDate, targetMonthRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetMonthRange.startDate, endDate: targetMonthRange.endDate, type: 'expense' }),
    enabled: isMonthCompare,
  })
  const { data: targetMonthIncome = [], isLoading: targetMonthIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetMonthRange.startDate, targetMonthRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetMonthRange.startDate, endDate: targetMonthRange.endDate, type: 'income' }),
    enabled: isMonthCompare,
  })

  // 年对比 - 当期年（支出+收入）
  const { data: currentYearExpense = [], isLoading: currentYearExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentYearRange.startDate, currentYearRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentYearRange.startDate, endDate: currentYearRange.endDate, type: 'expense' }),
    enabled: isYearCompare,
  })
  const { data: currentYearIncome = [], isLoading: currentYearIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', currentYearRange.startDate, currentYearRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: currentYearRange.startDate, endDate: currentYearRange.endDate, type: 'income' }),
    enabled: isYearCompare,
  })

  // 年对比 - 对比年（支出+收入）
  const { data: targetYearExpense = [], isLoading: targetYearExpenseLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetYearRange.startDate, targetYearRange.endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetYearRange.startDate, endDate: targetYearRange.endDate, type: 'expense' }),
    enabled: isYearCompare,
  })
  const { data: targetYearIncome = [], isLoading: targetYearIncomeLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', targetYearRange.startDate, targetYearRange.endDate, 'income'],
    queryFn: () => fetchCategoryBreakdown({ startDate: targetYearRange.startDate, endDate: targetYearRange.endDate, type: 'income' }),
    enabled: isYearCompare,
  })

  // 将支出/收入合并后按金额倒序，每个项目保留自己的类型（支出/收入），用于渲染时上色
  type MergedBreakdownItem = CategoryBreakdownItem & { type: 'expense' | 'income' }

  const mergeSorted = (exp: CategoryBreakdownItem[], inc: CategoryBreakdownItem[]): MergedBreakdownItem[] => {
    const merged: MergedBreakdownItem[] = [
      ...exp.map(d => ({ ...d, type: 'expense' as const })),
      ...inc.map(d => ({ ...d, type: 'income' as const })),
    ]
    return merged.sort((a, b) => Number(b.amount) - Number(a.amount))
  }

  // 其他模式：全局支出+收入合并为单栏
  const mergedDefaultBreakdown = useMemo(() => mergeSorted(expenseBreakdown, incomeBreakdown), [expenseBreakdown, incomeBreakdown])

  // 月对比：当期 / 对比期
  const currentMonthMerged = useMemo(() => mergeSorted(currentMonthExpense, currentMonthIncome), [currentMonthExpense, currentMonthIncome])
  const targetMonthMerged = useMemo(() => mergeSorted(targetMonthExpense, targetMonthIncome), [targetMonthExpense, targetMonthIncome])

  // 年对比：当期 / 对比期
  const currentYearMerged = useMemo(() => mergeSorted(currentYearExpense, currentYearIncome), [currentYearExpense, currentYearIncome])
  const targetYearMerged = useMemo(() => mergeSorted(targetYearExpense, targetYearIncome), [targetYearExpense, targetYearIncome])

  // 处理每日数据（本月视图）
  const dailyData = useMemo(() => {
    if (!dailySummaryQueries.data || !isDailyView) return []
    return dailySummaryQueries.data[0] || []
  }, [dailySummaryQueries.data, isDailyView])

  // 处理月对比数据（对比月份在前，当前月份在后）
  const monthCompareData = useMemo(() => {
    if (!dailySummaryQueries.data || !isMonthCompare) return { targetMonth: [], currentMonth: [] }
    return {
      targetMonth: dailySummaryQueries.data[0] || [],  // 对比月份
      currentMonth: dailySummaryQueries.data[1] || []  // 当前月份
    }
  }, [dailySummaryQueries.data, isMonthCompare])

  // 初始化图表
  useEffect(() => {
    if (!mainChartRef.current) return

    if (!mainChartInstance) {
      mainChartInstance = echarts.init(mainChartRef.current)
    }

    const isDailyView = period === 'month'
    const isMonthCompare = period === 'monthCompare'
    const isYearCompare = period === 'yearCompare'
    const isMonthlyView = ['3month', '6month', 'year'].includes(period)

    let option: echarts.EChartsOption = {}

    if (isDailyView && dailyData.length > 0) {
      // 本月每日视图
      const dates = dailyData.map(d => `${parseInt(d.date.slice(8, 10), 10)}日`)
      const expenses = dailyData.map(d => Number(d.total_expense || 0))
      const incomes = dailyData.map(d => Number(d.total_income || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const expense = params.find((p: any) => p.seriesName === '支出')?.value || 0
            const income = params.find((p: any) => p.seriesName === '收入')?.value || 0
            return `${params[0].name}<br/>支出：${formatAmount(expense)}<br/>收入：${formatAmount(income)}`
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: { rotate: 0 }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatAmount(value)
          }
        },
        series: [
          {
            name: '支出',
            type: 'bar',
            data: expenses,
            itemStyle: { color: '#e74c3c' }
          },
          {
            name: '收入',
            type: 'bar',
            data: incomes,
            itemStyle: { color: '#27ae60' }
          }
        ]
      }
    } else if (isMonthCompare) {
      // 月对比视图
      const maxDays = Math.max(monthCompareData.currentMonth.length, monthCompareData.targetMonth.length)
      const dates = Array.from({ length: maxDays }, (_, i) => `${i + 1}日`)
      
      const currExpenses = monthCompareData.currentMonth.map(d => Number(d.total_expense || 0))
      const currIncomes = monthCompareData.currentMonth.map(d => Number(d.total_income || 0))
      const targetExpenses = monthCompareData.targetMonth.map(d => Number(d.total_expense || 0))
      const targetIncomes = monthCompareData.targetMonth.map(d => Number(d.total_income || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const currExp = params.find((p: any) => p.seriesName === `${format(now, 'yyyy 年 MM 月')} 支出`)?.value || 0
            const currInc = params.find((p: any) => p.seriesName === `${format(now, 'yyyy 年 MM 月')} 收入`)?.value || 0
            const targetExp = params.find((p: any) => p.seriesName === `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 支出`)?.value || 0
            const targetInc = params.find((p: any) => p.seriesName === `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 收入`)?.value || 0
            return `${params[0].name}<br/>
              ${format(now, 'yyyy 年 MM 月')} 支出：${formatAmount(currExp)}<br/>
              ${format(now, 'yyyy 年 MM 月')} 收入：${formatAmount(currInc)}<br/>
              ${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 支出：${formatAmount(targetExp)}<br/>
              ${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 收入：${formatAmount(targetInc)}`
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: { rotate: 0 }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatAmount(value)
          }
        },
        series: [
          {
            name: `${format(now, 'yyyy 年 MM 月')} 支出`,
            type: 'bar',
            data: currExpenses,
            itemStyle: { color: '#c0392b' },
            barGap: '20%'
          },
          {
            name: `${format(now, 'yyyy 年 MM 月')} 收入`,
            type: 'bar',
            data: currIncomes,
            itemStyle: { color: '#1e8449' }
          },
          {
            name: `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 支出`,
            type: 'bar',
            data: targetExpenses,
            itemStyle: { color: '#e74c3c' }
          },
          {
            name: `${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')} 收入`,
            type: 'bar',
            data: targetIncomes,
            itemStyle: { color: '#27ae60' }
          }
        ]
      }
    } else if (isYearCompare && yoyExpenseData.length > 0 && yoyIncomeData.length > 0) {
      // 年对比视图（同时展示支出和收入）
      const monthLabels = yoyExpenseData.map(d => d.monthLabel)
      // 支出数据
      const currentYearExpenses = yoyExpenseData.map(d => Number(d.currentYear || 0))
      const targetYearExpenses = yoyExpenseData.map(d => Number(d.lastYear || 0))
      // 收入数据
      const currentYearIncomes = yoyIncomeData.map(d => Number(d.currentYear || 0))
      const targetYearIncomes = yoyIncomeData.map(d => Number(d.lastYear || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const currExp = params.find((p: any) => p.seriesName === `${currentYear}年 支出`)?.value || 0
            const currInc = params.find((p: any) => p.seriesName === `${currentYear}年 收入`)?.value || 0
            const targetExp = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 支出`)?.value || 0
            const targetInc = params.find((p: any) => p.seriesName === `${yearCompareTarget}年 收入`)?.value || 0
            return `${params[0].name}<br/>
              ${currentYear}年 支出：${formatAmount(currExp)}<br/>
              ${currentYear}年 收入：${formatAmount(currInc)}<br/>
              ${yearCompareTarget}年 支出：${formatAmount(targetExp)}<br/>
              ${yearCompareTarget}年 收入：${formatAmount(targetInc)}`
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: monthLabels,
          axisLabel: { rotate: 0 }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatAmount(value)
          }
        },
        series: [
          {
            name: `${currentYear}年 支出`,
            type: 'bar',
            data: currentYearExpenses,
            itemStyle: { color: '#c0392b' },
            barGap: '20%'
          },
          {
            name: `${currentYear}年 收入`,
            type: 'bar',
            data: currentYearIncomes,
            itemStyle: { color: '#1e8449' }
          },
          {
            name: `${yearCompareTarget}年 支出`,
            type: 'bar',
            data: targetYearExpenses,
            itemStyle: { color: '#e74c3c' }
          },
          {
            name: `${yearCompareTarget}年 收入`,
            type: 'bar',
            data: targetYearIncomes,
            itemStyle: { color: '#27ae60' }
          }
        ]
      }
    } else if (isMonthlyView && trendData.length > 0) {
      // 月度汇总视图（近 3 月/近 6 月/近 1 年）
      const monthLabels = trendData.map(d => d.month.slice(5) + '月')
      const expenses = trendData.map(d => Number(d.expense || 0))
      const incomes = trendData.map(d => Number(d.income || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const expense = params.find((p: any) => p.seriesName === '支出')?.value || 0
            const income = params.find((p: any) => p.seriesName === '收入')?.value || 0
            return `${params[0].name}<br/>支出：${formatAmount(expense)}<br/>收入：${formatAmount(income)}`
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: monthLabels,
          axisLabel: { rotate: 0 }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value: number) => formatAmount(value)
          }
        },
        series: [
          {
            name: '支出',
            type: 'bar',
            data: expenses,
            itemStyle: { color: '#e74c3c' }
          },
          {
            name: '收入',
            type: 'bar',
            data: incomes,
            itemStyle: { color: '#27ae60' }
          }
        ]
      }
    }

    mainChartInstance.setOption(option as any)

    // 响应式调整
    const handleResize = () => {
      mainChartInstance?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [period, dailyData, monthCompareData, yoyExpenseData, yoyIncomeData, trendData, currentMonth, currentYear, monthCompareTarget, yearCompareTarget, now])

  const mainLoading = trendLoading || dailySummaryQueries.isLoading || yoyExpenseLoading || yoyIncomeLoading
  const categoryLoading = isMonthCompare
    ? currentMonthExpenseLoading || currentMonthIncomeLoading || targetMonthExpenseLoading || targetMonthIncomeLoading
    : isYearCompare
    ? currentYearExpenseLoading || currentYearIncomeLoading || targetYearExpenseLoading || targetYearIncomeLoading
    : expenseBreakdownLoading || incomeBreakdownLoading

  return (
    <div className="page-container">
      {/* Tab 切换 */}
      <div className="reports-tab-row">
        <button
          className={`reports-tab ${tab === 'analysis' ? 'active' : ''}`}
          onClick={() => setTab('analysis')}
        >
          数据分析
        </button>
        <button
          className={`reports-tab ${tab === 'members' ? 'active' : ''}`}
          onClick={() => setTab('members')}
        >
          成员对比
        </button>
      </div>

      {tab === 'analysis' && (
        <>
          {/* 时间周期选择 */}
          {mainLoading ? (
        <div className="rprs-row" style={{ opacity: 0.7 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} width="60px" height="28px" borderRadius="var(--rs)" />
          ))}
        </div>
      ) : (
        <div className="rprs-row">
          <button className={`rprs ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>本月</button>
          <button className={`rprs ${period === '3month' ? 'active' : ''}`} onClick={() => setPeriod('3month')}>近 3 月</button>
          <button className={`rprs ${period === '6month' ? 'active' : ''}`} onClick={() => setPeriod('6month')}>近 6 月</button>
          <button className={`rprs ${period === 'year' ? 'active' : ''}`} onClick={() => setPeriod('year')}>近 1 年</button>
          <button className={`rprs ${period === 'monthCompare' ? 'active' : ''}`} onClick={() => setPeriod('monthCompare')}>月对比</button>
          <button className={`rprs ${period === 'yearCompare' ? 'active' : ''}`} onClick={() => setPeriod('yearCompare')}>年对比</button>
        </div>
      )}

      {/* 月度支出/收入对比 */}
      <div className="dash-card">
        {mainLoading ? (
          <>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton width="35%" height="14px" />
              <Skeleton width="25%" height="12px" />
            </div>
            <Skeleton width="100%" height="300px" borderRadius="var(--rs)" />
          </>
        ) : (
          <>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>
                {isDailyView && '本月每日支出/收入'}
                {isMonthlyView && '月度支出/收入汇总'}
                {isMonthCompare && '月对比'}
                {isYearCompare && '年对比'}
              </h3>
              {/* 月对比选择器 - 仅对比月份支持下拉框 */}
              {isMonthCompare && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>
                    {format(now, 'yyyy 年 MM 月')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
                  <select 
                    value={monthCompareTarget} 
                    onChange={(e) => setMonthCompareTarget(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--bd)', background: 'var(--bg)', fontSize: '12px' }}
                  >
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* 年对比选择器 - 仅对比年份支持下拉框 */}
              {isYearCompare && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>
                    {currentYear}年
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
                  <select 
                    value={yearCompareTarget} 
                    onChange={(e) => setYearCompareTarget(Number(e.target.value))}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--bd)', background: 'var(--bg)', fontSize: '12px' }}
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}年</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div ref={mainChartRef} style={{ width: '100%', height: '300px' }} />
          </>
        )}
      </div>

      {/* 分类排行 */}
      <div className="dash-card" style={{ marginTop: '14px' }}>
        {categoryLoading ? (
          <>
            <div className="card-header">
              <Skeleton width="25%" height="14px" />
            </div>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Skeleton width="25%" height="12px" />
                  <Skeleton width="15%" height="12px" />
                </div>
                <Skeleton width="100%" height="4px" borderRadius="2px" />
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="card-header">
              <h3>
                分类排行
                {isDailyView && '（本月）'}
                {isMonthlyView && `（近${months}个月）`}
                {isMonthCompare && `（${format(now, 'yyyy 年 MM 月')} vs ${format(parseISO(monthCompareTarget), 'yyyy 年 MM 月')}）`}
                {isYearCompare && `（${currentYear}年 vs ${yearCompareTarget}年）`}
              </h3>
            </div>
            {(isMonthCompare || isYearCompare) ? (
              // 月对比 / 年对比：分两栏，左当期，右对比期，每期收入支出混排
              <div style={{ display: 'flex', gap: '24px' }}>
                {/* 左栏：当期 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fg)', marginBottom: '10px' }}>
                    {isMonthCompare ? format(now, 'yyyy 年 MM 月') : `${currentYear}年`}
                  </div>
                  <RankList
                    items={isMonthCompare ? currentMonthMerged : currentYearMerged}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryName={getCategoryName}
                  />
                </div>
                {/* 右栏：对比期 */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fg)', marginBottom: '10px' }}>
                    {isMonthCompare ? format(parseISO(monthCompareTarget), 'yyyy 年 MM 月') : `${yearCompareTarget}年`}
                  </div>
                  <RankList
                    items={isMonthCompare ? targetMonthMerged : targetYearMerged}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryName={getCategoryName}
                  />
                </div>
              </div>
            ) : (
              // 其他模式：单栏，收入和支出放一起排行
              <div>
                <RankList
                  items={mergedDefaultBreakdown}
                  getCategoryIcon={getCategoryIcon}
                  getCategoryName={getCategoryName}
                />
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}

      {tab === 'members' && (
        <>
          <div className="dash-card" style={{ marginBottom: '14px' }}>
            <div className="card-header">
              <h3>时间范围</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
              <span style={{ fontSize: '13px', color: 'var(--fg2)' }}>从</span>
              <select
                value={mcMonthFrom}
                onChange={(e) => setMcMonthFrom(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 'var(--rs)', border: '1px solid var(--bd)', background: 'var(--srf)', fontSize: '13px', color: 'var(--fg)' }}
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg3)' }}>至</span>
              <select
                value={mcMonthTo}
                onChange={(e) => setMcMonthTo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 'var(--rs)', border: '1px solid var(--bd)', background: 'var(--srf)', fontSize: '13px', color: 'var(--fg)' }}
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {currentBook?.id ? (
            <MemberComparison
              bookId={currentBook.id}
              monthFrom={mcMonthFrom}
              monthTo={mcMonthTo}
            />
          ) : (
            <div className="dash-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg2)' }}>
              请先选择一个账本
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Reports
