import React, { useState, useMemo, useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns'
import { fetchMonthlyTrend, fetchCategoryBreakdown, fetchDailySummary, fetchYearOverYear } from '../../services/statisticsApi'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useBook } from '../../hooks/useBook'
import { formatAmount } from '../../utils/common'
import { Skeleton } from '../../components/ui/Skeleton'
import MemberComparison from './MemberComparison'
import type { CategoryBreakdownItem } from '../../types/statistics'

const Reports: React.FC = () => {
  const navigate = useNavigate()
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

  // 获取年度对比数据
  const { data: yoyData = [], isLoading: yoyLoading } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yearCompare?.currentYear, yearCompare?.compareYear],
    queryFn: () => fetchYearOverYear({ 
      year: yearCompare?.currentYear, 
      compareYear: yearCompare?.compareYear,
      type: 'expense'
    }),
    enabled: isYearCompare && !!yearCompare,
  })

  // 获取分类 breakdown 数据
  const { data: breakdownData = [], isLoading: breakdownLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', startDate, endDate, 'expense'],
    queryFn: () => fetchCategoryBreakdown({ startDate, endDate, type: 'expense' }),
  })

  const sortedBreakdown = useMemo(() => {
    return [...breakdownData].sort((a, b) => Number(b.amount) - Number(a.amount))
  }, [breakdownData])

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
    } else if (isYearCompare && yoyData.length > 0) {
      // 年对比视图
      const monthLabels = yoyData.map(d => d.monthLabel)
      const currentYearAmounts = yoyData.map(d => Number(d.currentYear || 0))
      const targetYearAmounts = yoyData.map(d => Number(d.lastYear || 0))

      option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const currentVal = params.find((p: any) => p.seriesName === `${currentYear}年`)?.value || 0
            const targetVal = params.find((p: any) => p.seriesName === `${yearCompareTarget}年`)?.value || 0
            return `${params[0].name}<br/>${currentYear}年：${formatAmount(currentVal)}<br/>${yearCompareTarget}年：${formatAmount(targetVal)}`
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
            name: `${currentYear}年`,
            type: 'bar',
            data: currentYearAmounts,
            itemStyle: { color: '#c0392b' },
            barGap: '20%'
          },
          {
            name: `${yearCompareTarget}年`,
            type: 'bar',
            data: targetYearAmounts,
            itemStyle: { color: '#e74c3c' }
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
  }, [period, dailyData, monthCompareData, yoyData, trendData, currentMonth, currentYear, monthCompareTarget, yearCompareTarget, now])

  const mainLoading = trendLoading || dailySummaryQueries.isLoading || yoyLoading

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
        {breakdownLoading ? (
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
            <div>
              {sortedBreakdown.map((item, i) => {
                const amount = Number(item.amount)
                const total = sortedBreakdown.reduce((s, d) => s + Number(d.amount), 0)
                const pct = total > 0 ? (amount / total) * 100 : 0
                return (
                  <div key={item.category_id} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {getCategoryIcon(item.category_id)} {getCategoryName(item.category_id)}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--exp)' }}>
                        {formatAmount(amount)} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--exp)', borderRadius: 2, transition: 'width 0.35s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
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
