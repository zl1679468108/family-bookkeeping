import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, differenceInMonths, subMonths } from 'date-fns'
import { Header } from '../components/Header'
import { ChartCard } from '../components/ChartCard'
import { StatCard } from '../components/StatCard'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { CategoryRanking } from '../components/CategoryRanking'
import { fetchSummary, fetchMonthlyTrend, fetchCategoryBreakdown } from '../services/statisticsApi'
import { exportToExcel, exportToPDF } from '../services/api'
import type { MonthlyTrendItem, CategoryBreakdownItem } from '../types/statistics'
import { formatAmount } from '../utils/common'
import { notify } from '../utils/notifications'

/** 格式化环比趋势数据，匹配 StatCard 的 trend 属性 */
const formatTrend = (
  change: number,
  changePercent: number | null,
): { value: string; positive: boolean } | undefined => {
  if (changePercent === null || changePercent === undefined) return undefined
  if (changePercent === 0) return { value: '持平', positive: true }
  const sign = change > 0 ? '+' : ''
  return {
    value: `${sign}${changePercent.toFixed(1)}%`,
    positive: change > 0,
  }
}

const Reports: React.FC = () => {
  const today = new Date()

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    }
  })

  const [trendType, setTrendType] = useState<'expense' | 'income'>('expense')
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  // 根据选中的日期范围计算趋势图应展示的月数
  const trendMonths = useMemo(() => {
    const months = differenceInMonths(
      endOfMonth(new Date(dateRange.endDate)),
      new Date(dateRange.startDate),
    ) + 1
    return Math.max(1, Math.min(months, 24))
  }, [dateRange.startDate, dateRange.endDate])

  // 统计概览
  const {
    data: summary,
  } = useQuery({
    queryKey: ['statistics', 'summary', dateRange.startDate, dateRange.endDate],
    queryFn: () => fetchSummary({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
  })

  // 月度趋势
  const {
    data: trendData = [],
    isLoading: trendLoading,
  } = useQuery({
    queryKey: ['statistics', 'monthly-trend', trendMonths, trendType],
    queryFn: () => fetchMonthlyTrend({ months: trendMonths, type: trendType }),
  })

  // 分类占比
  const {
    data: breakdownData = [],
    isLoading: breakdownLoading,
  } = useQuery({
    queryKey: ['statistics', 'category-breakdown', dateRange.startDate, dateRange.endDate, 'expense'],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: 'expense',
      }),
  })

  /** 导出报表（Excel / PDF） */
  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(type)
    try {
      const fn = type === 'excel' ? exportToExcel : exportToPDF
      await fn({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      notify({ type: 'success', message: `${type === 'excel' ? 'Excel' : 'PDF'} 导出成功` })
    } catch (error: any) {
      notify({ type: 'error', message: error?.message || '导出失败，请重试' })
    } finally {
      setExporting(null)
    }
  }

  return (
    <div>
      <Header title="统计报表" />

      {/* 时间筛选器 + 导出按钮 */}
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {exporting === 'excel' ? '导出中...' : '📊 Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {exporting === 'pdf' ? '导出中...' : '📄 PDF'}
          </button>
        </div>
      </div>

      {/* 概览卡片组: 收入 / 支出 / 结余 */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard
          label="总收入"
          value={formatAmount(summary?.totalIncome || 0)}
          trend={summary ? formatTrend(summary.incomeChange, summary.incomeChangePercent) : undefined}
        />
        <StatCard
          label="总支出"
          value={formatAmount(summary?.totalExpense || 0)}
          trend={summary ? formatTrend(summary.expenseChange, summary.expenseChangePercent) : undefined}
        />
        <StatCard
          label="结余"
          value={formatAmount(summary?.balance || 0)}
          trend={summary ? formatTrend(summary.balanceChange, summary.balanceChangePercent) : undefined}
          isBalance
        />
      </div>

      {/* 双图并排: 收支趋势 + 分类占比 */}
      <div className="charts-grid">
        <ChartCard
          title="收支趋势"
          chartType="trend"
          data={trendData as MonthlyTrendItem[]}
          loading={trendLoading}
          typeOptions={[
            { value: 'expense', label: '支出' },
            { value: 'income', label: '收入' },
          ]}
          onTypeChange={(val) => setTrendType(val as 'expense' | 'income')}
          activeType={trendType}
        />
        <ChartCard
          title="支出分类"
          chartType="pie"
          data={breakdownData as CategoryBreakdownItem[]}
          loading={breakdownLoading}
        />
      </div>

      {/* 分类排行表 */}
      <h2 className="section-title">本月支出分类</h2>
      <CategoryRanking
        data={breakdownData || []}
        type="expense"
        totalAmount={summary?.totalExpense || 0}
      />
    </div>
  )
}

export default Reports
