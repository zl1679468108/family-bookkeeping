import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBook } from '../../hooks/useBook'
import { useMemberColors } from '../../hooks/useMemberColors'
import { Card, CardHeader } from '../../components/ui/Card'
import { SegControl } from '../../components/ui/SegControl'
import { DropdownSelect } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { MetricRow } from '../../components/ui/MetricRow'
import { EmptyAddTransactionAction } from '../../components/ui/EmptyState/emptyActions'
import MemberComparison from './MemberComparison'
import { TrendChart } from './components/TrendChart'
import { CategoryRankChart } from './components/CategoryRankChart'
import { useReportData, PeriodType, REPORT_PERIOD_OPTIONS } from './hooks/useReportData'
import { shiftToYearMonthString } from '../../utils/monthState'
import { formatAmount } from '../../utils/common'
import { formatMonthDisplay } from '../../utils/month'
import { EMPTY_NO_CATEGORY_DATA, EMPTY_NO_TRANSACTIONS_PERIOD, EMPTY_MEMBER_COMPARE_NEED_MULTI, EMPTY_SELECT_BOOK } from '../../utils/emptyCopy'
import { TITLE_CATEGORY_RATIO, TITLE_DATA_ANALYSIS, TITLE_MEMBER_COMPARE, reportChartTitle } from '../../utils/sectionCopy'
import { FORM_SEARCH_MONTH, FORM_SEARCH_YEAR } from '../../utils/formCopy'
import { ACTION_START_BOOKKEEPING } from '../../utils/actionCopy'

const Reports: React.FC = () => {
  const navigate = useNavigate()
  const { currentBook } = useBook()
  const { isMultiMember } = useMemberColors(currentBook?.id)
  const [tab, setTab] = useState<'analysis' | 'members'>('analysis')
  const [memberStartMonth, setMemberStartMonth] = useState(() => shiftToYearMonthString(-11))
  const [memberEndMonth, setMemberEndMonth] = useState(() => shiftToYearMonthString(0))

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

  const chartTitle = reportChartTitle({
    isDailyView,
    isMonthlyView,
    isMonthCompare,
    isYearCompare,
  })

  const periodOptions = REPORT_PERIOD_OPTIONS.map(({ key, label }) => ({ key, label }))

  return (
    <div className="page-container">
      <div className="reports-header">
        <SegControl
          options={[{ value: 'analysis', label: TITLE_DATA_ANALYSIS }, { value: 'members', label: TITLE_MEMBER_COMPARE }]}
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
                <MetricRow
                  items={[
                    { label: '总收入', value: formatAmount(totalIncome), tone: 'income' },
                    { label: '总支出', value: formatAmount(totalExpense), tone: 'expense' },
                  ]}
                />
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
                  <CardHeader title={TITLE_CATEGORY_RATIO} />
                  {mergedDefaultBreakdown.length > 0 ? (
                    <CategoryRankChart data={mergedDefaultBreakdown} height="280px" />
                  ) : (
                    <EmptyState variant="compact" description={EMPTY_NO_CATEGORY_DATA} />
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
                      <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>{formatMonthDisplay(now)}</span>
                      <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
                      <DropdownSelect options={monthOptions} value={monthCompareTarget} onChange={(k) => k && setMonthCompareTarget(k)} showSearch searchPlaceholder={FORM_SEARCH_MONTH} />
                    </div>
                  ) : isYearCompare ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>{currentYear}年</span>
                      <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>vs</span>
                      <DropdownSelect options={yearOptions} value={String(yearCompareTarget)} onChange={(k) => k && setYearCompareTarget(Number(k))} showSearch searchPlaceholder={FORM_SEARCH_YEAR} />
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
                  <div style={{ position: 'relative', marginTop: '-300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: 'var(--srf)' }}>
                    <EmptyState description={EMPTY_NO_TRANSACTIONS_PERIOD} action={<EmptyAddTransactionAction label={ACTION_START_BOOKKEEPING} onClick={() => navigate('/add?type=expense')} />} />
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
              <EmptyState description={EMPTY_MEMBER_COMPARE_NEED_MULTI} />
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: 'var(--fg2)' }}>时间范围</span>
                <DropdownSelect options={monthOptions} value={memberStartMonth} onChange={(k) => k && setMemberStartMonth(k)} showSearch searchPlaceholder={FORM_SEARCH_MONTH} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg3)' }}>至</span>
                <DropdownSelect options={monthOptions} value={memberEndMonth} onChange={(k) => k && setMemberEndMonth(k)} showSearch searchPlaceholder={FORM_SEARCH_MONTH} />
              </div>
              {currentBook?.id ? (
                <MemberComparison monthFrom={memberStartMonth} monthTo={memberEndMonth} />
              ) : (
                <Card>
                  <EmptyState description={EMPTY_SELECT_BOOK} />
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
