import React, { useState } from 'react'
import { format } from 'date-fns'
import { useBook } from '../../hooks/useBook'
import { useMemberColors } from '../../hooks/useMemberColors'
import { Card, CardHeader } from '../../components/ui/Card'
import { SegControl } from '../../components/ui/SegControl'
import { DropdownSelect } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import MemberComparison from './MemberComparison'
import { TrendChart } from './components/TrendChart'
import { CategoryRankChart } from './components/CategoryRankChart'
import { useReportData, PeriodType } from './hooks/useReportData'
import { formatAmount } from '../../utils/common'

const Reports: React.FC = () => {
  const { currentBook } = useBook()
  const { isMultiMember } = useMemberColors(currentBook?.id)
  const [tab, setTab] = useState<'analysis' | 'members'>('analysis')
  const [memberStartMonth, setMemberStartMonth] = useState(format(new Date().setMonth(new Date().getMonth() - 11), 'yyyy-MM'))
  const [memberEndMonth, setMemberEndMonth] = useState(format(new Date(), 'yyyy-MM'))

  const {
    period, setPeriod,
    monthCompareTarget, setMonthCompareTarget,
    yearCompareTarget, setYearCompareTarget,
    now, currentYear,
    yearOptions, monthOptions,
    isDailyView, isMonthCompare, isYearCompare, isMonthlyView,
    trendData, dailySummaryQueries, yoyExpenseData, yoyIncomeData,
    mainLoading, categoryLoading,
    mergedDefaultBreakdown,
    totalExpense, totalIncome,
  } = useReportData()

  // T-L4: dailyData 和 monthCompareData 的 memo 已移至 useReportData 内部统一管理
  const dailyData = dailySummaryQueries.data?.[0] || []
  const monthCompareData = {
    targetMonth: dailySummaryQueries.data?.[0] || [],
    currentMonth: dailySummaryQueries.data?.[1] || [],
  }

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

  const periodOptions = [
    { key: PeriodType.Month, label: '本月' },
    { key: PeriodType.ThreeMonth, label: '近 3 月' },
    { key: PeriodType.SixMonth, label: '近 6 月' },
    { key: PeriodType.Year, label: '近 1 年' },
    { key: PeriodType.MonthCompare, label: '月对比' },
    { key: PeriodType.YearCompare, label: '年对比' },
  ]

  return (
    <div className="page-container">
      <div className="reports-header">
        <SegControl
          options={[{ value: 'analysis', label: '数据分析' }, { value: 'members', label: '成员对比' }]}
          value={tab}
          onChange={(v) => setTab(v as 'analysis' | 'members')}
        />
        {tab === 'analysis' && (
          <div className="reports-filter">
            {mainLoading ? (
              <Skeleton width="120px" height="32px" borderRadius="var(--rs)" />
            ) : (
              <DropdownSelect
                options={periodOptions}
                value={period}
                onChange={(k) => k && setPeriod(k as PeriodType)}
              />
            )}
          </div>
        )}
      </div>

      {tab === 'analysis' && (
        <>
          {/* 总收入/总支出 + 分类占比 并排 */}
          <div className="reports-summary-row">
            {/* 总收入、总支出卡片 */}
            <Card className="reports-summary-card">
              {mainLoading ? (
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ flex: 1, padding: '16px' }}>
                    <Skeleton width="60%" height="14px" />
                    <Skeleton style={{ marginTop: '8px' }} width="80%" height="24px" />
                  </div>
                  <div style={{ flex: 1, padding: '16px' }}>
                    <Skeleton width="60%" height="14px" />
                    <Skeleton style={{ marginTop: '8px' }} width="80%" height="24px" />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '8px' }}>总收入</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--inc)' }}>{formatAmount(totalIncome)}</div>
                  </div>
                  <div style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '8px' }}>总支出</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--exp)' }}>{formatAmount(totalExpense)}</div>
                  </div>
                </div>
              )}
            </Card>

            {/* 分类占比卡片 */}
            <Card className="reports-category-card">
              {categoryLoading ? (
                <>
                  <CardHeader title={<Skeleton width="35%" height="16px" />} />
                  <Skeleton width="100%" height="280px" borderRadius="var(--rs)" />
                </>
              ) : (
                <>
                  <CardHeader title="分类占比" />
                  {mergedDefaultBreakdown.length > 0 ? (
                    <CategoryRankChart data={mergedDefaultBreakdown} height="280px" />
                  ) : (
                    <EmptyState variant="compact" title="暂无分类数据" description="请等待数据加载或切换其他时间段" />
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Trend Chart Card */}
          <Card style={{ marginTop: '14px' }}>
            {mainLoading ? (
              <>
                <CardHeader title={<Skeleton width="45%" height="16px" />} action={
                  isMonthCompare || isYearCompare ? <Skeleton width="200px" height="24px" /> : null
                } />
                <Skeleton width="100%" height="300px" borderRadius="var(--rs)" />
              </>
            ) : (
              <>
                <CardHeader title={chartTitle} action={
                  isMonthCompare ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>{format(now, 'yyyy 年 MM 月')}</span>
                      <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
                      <DropdownSelect options={monthOptions} value={monthCompareTarget} onChange={(k) => k && setMonthCompareTarget(k)} showSearch searchPlaceholder="搜索月份..." />
                    </div>
                  ) : isYearCompare ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>{currentYear}年</span>
                      <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
                      <DropdownSelect options={yearOptions} value={String(yearCompareTarget)} onChange={(k) => k && setYearCompareTarget(Number(k))} showSearch searchPlaceholder="搜索年份..." />
                    </div>
                  ) : null
                } />
                <TrendChart
                  period={period} now={now} currentYear={currentYear}
                  monthCompareTarget={monthCompareTarget} yearCompareTarget={yearCompareTarget}
                  isDailyView={isDailyView} isMonthCompare={isMonthCompare} isYearCompare={isYearCompare} isMonthlyView={isMonthlyView}
                  dailyData={dailyData} monthCompareData={monthCompareData}
                  yoyExpenseData={yoyExpenseData} yoyIncomeData={yoyIncomeData} trendData={trendData} mainLoading={mainLoading}
                />
                {!chartHasData && (
                  <div style={{ position: 'relative', marginTop: '-300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: 'var(--bg-card)' }}>
                    <EmptyState title="暂无数据" description="当前时间段内没有交易记录" action={<Button variant="outline">开始记账</Button>} />
                  </div>
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
              <EmptyState title="单成员账本" description="成员对比功能仅在多成员账本中可用，请切换至其他账本或邀请家人加入" />
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--fg2)' }}>时间范围</span>
                <DropdownSelect options={monthOptions} value={memberStartMonth} onChange={(k) => k && setMemberStartMonth(k)} showSearch searchPlaceholder="搜索月份..." />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg3)' }}>至</span>
                <DropdownSelect options={monthOptions} value={memberEndMonth} onChange={(k) => k && setMemberEndMonth(k)} showSearch searchPlaceholder="搜索月份..." />
              </div>
              {currentBook?.id ? (
                <MemberComparison monthFrom={memberStartMonth} monthTo={memberEndMonth} />
              ) : (
                <Card>
                  <EmptyState title="请先选择一个账本" description="在左侧账本列表中选择要查看的账本" />
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
