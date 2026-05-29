import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, differenceInMonths, subMonths } from 'date-fns'
import { Header } from '../components/Header'
import { ChartCard } from '../components/ChartCard'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { CategoryRanking } from '../components/CategoryRanking'
import { fetchMonthlyTrend, fetchCategoryBreakdown, fetchYearOverYear } from '../services/statisticsApi'
import { exportToExcel, exportToPDF } from '../services/api'
import type { MonthlyTrendItem, CategoryBreakdownItem, YoYComparisonItem } from '../types/statistics'
import { notify } from '../utils/notifications'
import '../styles/layout.scss'
import './Reports.scss'

const Reports: React.FC = () => {
  const navigate = useNavigate()
  const today = new Date()

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    return {
      startDate: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    }
  })

  const [analysisTab, setAnalysisTab] = useState<'expense' | 'income'>('expense')
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [yoyYear] = useState(new Date().getFullYear())

  const trendMonths = useMemo(() => {
    const months = differenceInMonths(
      endOfMonth(new Date(dateRange.endDate)),
      new Date(dateRange.startDate),
    ) + 1
    return Math.max(1, Math.min(months, 24))
  }, [dateRange.startDate, dateRange.endDate])

  // 月度趋势（跟随 analysisTab）
  const {
    data: trendData = [],
    isLoading: trendLoading,
  } = useQuery({
    queryKey: ['statistics', 'monthly-trend', trendMonths, analysisTab],
    queryFn: () => fetchMonthlyTrend({ months: trendMonths, type: analysisTab }),
  })

  // 分类占比
  const {
    data: breakdownData = [],
    isLoading: breakdownLoading,
  } = useQuery({
    queryKey: ['statistics', 'category-breakdown', dateRange.startDate, dateRange.endDate, analysisTab],
    queryFn: () =>
      fetchCategoryBreakdown({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        type: analysisTab,
      }),
  })

  // 年度对比
  const {
    data: yoyData = [],
    isLoading: yoyLoading,
  } = useQuery({
    queryKey: ['statistics', 'yoy-comparison', yoyYear, analysisTab],
    queryFn: () => fetchYearOverYear({ year: yoyYear, type: analysisTab }),
  })

  const handleCategoryClick = (categoryKey: string) => {
    navigate(
      `/transactions?category=${encodeURIComponent(categoryKey)}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=${analysisTab}`
    )
  }

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

  const isExpense = analysisTab === 'expense'

  return (
    <div>
      <Header title="统计报表" />

      {/* 时间筛选器 + 导出按钮 */}
      <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
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

      {/* Tab: 支出分析 / 收入分析 */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        background: 'var(--bg)', borderRadius: 'var(--radius-md)',
        padding: '4px', width: 'fit-content',
      }}>
        <button
          onClick={() => setAnalysisTab('expense')}
          style={{
            padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            background: isExpense ? 'var(--accent)' : 'transparent',
            color: isExpense ? '#fff' : 'var(--muted)', transition: 'all 0.2s ease',
          }}
        >支出分析</button>
        <button
          onClick={() => setAnalysisTab('income')}
          style={{
            padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: 500,
            background: !isExpense ? 'var(--accent)' : 'transparent',
            color: !isExpense ? '#fff' : 'var(--muted)', transition: 'all 0.2s ease',
          }}
        >收入分析</button>
      </div>

      {/* 趋势 + 分类占比 */}
      <div className="charts-grid">
        <ChartCard
          title={isExpense ? '支出趋势' : '收入趋势'}
          chartType="trend"
          data={trendData as MonthlyTrendItem[]}
          loading={trendLoading}
        />
        <ChartCard
          title={isExpense ? '支出分类' : '收入来源'}
          chartType="pie"
          data={breakdownData as CategoryBreakdownItem[]}
          loading={breakdownLoading}
          onCategoryClick={handleCategoryClick}
        />
      </div>

      {/* 年度对比 */}
      <div style={{ marginBottom: '32px' }}>
        <ChartCard
          title={isExpense ? '支出对比' : '收入对比'}
          chartType="yoy"
          data={yoyData as YoYComparisonItem[]}
          loading={yoyLoading}
          seriesLabels={[`${yoyYear}年`, `${yoyYear - 1}年`]}
        />
      </div>

      {/* 排行 */}
      <h2 className="section-title">
        {isExpense ? '支出排行' : '收入排行'}
      </h2>
      <CategoryRanking
        data={breakdownData || []}
        type={analysisTab}
        totalAmount={(breakdownData || []).reduce((sum, item) => sum + item.amount, 0)}
      />
    </div>
  )
}

export default Reports
