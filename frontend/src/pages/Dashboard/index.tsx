import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { Info } from 'lucide-react'
import { Header } from '../../components/Header'
import { Button } from '../../components/ui/button'
import { StatCard } from '../../components/StatCard'
import { TransactionsList } from '../../components/TransactionsList'
import { Tooltip } from '../../components/ui/tooltip'
import { BudgetProgressBar } from '../../components/BudgetProgressBar'
import { BudgetAlertBanner } from '../../components/BudgetAlertBanner'
import { useBudgetNavigate } from '../../hooks/useBudgetNavigation'
import '../../styles/layout.scss'
import { formatAmount } from '../../utils/common'
import { getTransactions } from '../../services/api'
import { fetchSummary } from '../../services/statisticsApi'
import { fetchBudgetStatus } from '../../services/budgetsApi'
import { useCategoryLookup } from '../../hooks/useCategories'
import { Skeleton } from '../../components/ui/Skeleton'

/** 格式化环比趋势数据 */
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(new Date(), 'yyyy-MM-dd')
  const monthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['statistics', 'summary', monthStart, monthEnd],
    queryFn: () => fetchSummary({ startDate: monthStart, endDate: monthEnd }),
  })

  const { data: recentPaginated, isLoading: recentLoading } = useQuery({
    queryKey: ['transactions', 'recent', monthStart, monthEnd],
    queryFn: () => getTransactions({ pageSize: 5, startDate: monthStart, endDate: monthEnd }),
  })

  const { data: budgetStatus, isLoading: budgetLoading } = useQuery({
    queryKey: ['budgets', 'status', monthStr],
    queryFn: () => fetchBudgetStatus(monthStr),
  })

  const recentTransactions = recentPaginated?.data || []
  const hasBudget = budgetStatus && budgetStatus.totalBudget > 0
  const hasAlerts = budgetStatus && budgetStatus.alerts.length > 0

  const navigateToCategory = useBudgetNavigate()
  const [alertDismissed, setAlertDismissed] = useState(() => {
    return localStorage.getItem(`dismissed_alert_${monthStr.substring(0, 7)}`) === 'true'
  })

  const handleDismissAlert = () => {
    localStorage.setItem(`dismissed_alert_${monthStr.substring(0, 7)}`, 'true')
    setAlertDismissed(true)
  }

  const handleBudgetNavigate = (categoryId: string) => {
    navigateToCategory(categoryId, monthStr.substring(0, 7))
  }

  return (
    <div>
      <Header title="概览" />

      {/* 1. 月度概览卡片——3列 */}
      <div className="cards-grid">
        {summaryLoading ? (
          <>
            <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
              <Skeleton width="60%" height="14px" marginBottom="12px" />
              <Skeleton width="80%" height="28px" marginBottom="8px" />
              <Skeleton width="40%" height="12px" />
            </div>
            <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
              <Skeleton width="60%" height="14px" marginBottom="12px" />
              <Skeleton width="80%" height="28px" marginBottom="8px" />
              <Skeleton width="40%" height="12px" />
            </div>
            <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
              <Skeleton width="60%" height="14px" marginBottom="12px" />
              <Skeleton width="80%" height="28px" marginBottom="8px" />
              <Skeleton width="40%" height="12px" />
            </div>
          </>
        ) : (
          <>
            <StatCard
              label="本月结余"
              value={formatAmount(summary?.balance || 0)}
              trend={summary ? formatTrend(summary.balanceChange, summary.balanceChangePercent) : undefined}
              isBalance
            />
            <StatCard
              label="本月收入"
              value={formatAmount(summary?.totalIncome || 0)}
              trend={summary ? formatTrend(summary.incomeChange, summary.incomeChangePercent) : undefined}
            />
            <StatCard
              label="本月支出"
              value={formatAmount(summary?.totalExpense || 0)}
              trend={summary ? formatTrend(summary.expenseChange, summary.expenseChangePercent) : undefined}
            />
          </>
        )}
      </div>

      {/* 预算预警 Banner */}
      {hasAlerts && !alertDismissed && (
        <BudgetAlertBanner
          alerts={budgetStatus!.alerts}
          monthKey={monthStr.substring(0, 7)}
          onDismiss={handleDismissAlert}
        />
      )}

      {/* 2. 预算概览 */}
      {budgetLoading ? (
        <div style={{ padding: '24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <Skeleton width="30%" height="16px" marginBottom="16px" />
          <Skeleton width="100%" height="8px" borderRadius="4px" marginBottom="12px" />
          <Skeleton width="50%" height="12px" />
        </div>
      ) : hasBudget ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600 }}>📊 预算概览</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
              总预算 ¥{budgetStatus.totalBudget.toLocaleString('zh-CN')}
            </span>
            <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(budgetStatus.overallProgress, 100)}%`,
                background: budgetStatus.overallProgress >= 100 ? 'var(--danger)' : budgetStatus.overallProgress >= 80 ? 'var(--warning)' : 'var(--success)',
                borderRadius: '4px', transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{
              fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
              color: budgetStatus.overallProgress >= 100 ? 'var(--danger)' : budgetStatus.overallProgress >= 80 ? 'var(--warning)' : 'var(--muted)',
            }}>
              {budgetStatus.overallProgress}%
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
            已花费 ¥{budgetStatus.totalSpent.toLocaleString('zh-CN')} / 剩余 ¥{budgetStatus.remaining.toLocaleString('zh-CN')}
          </div>
          {hasAlerts && (
            <div style={{
              marginTop: '16px', padding: '16px', borderRadius: 'var(--radius-md)',
              background: budgetStatus.alerts.some(a => a.progress >= 100)
                ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              border: `1px solid ${budgetStatus.alerts.some(a => a.progress >= 100) ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}>
              <div style={{
                fontSize: '13px', fontWeight: 600, marginBottom: '10px',
                color: budgetStatus.alerts.some(a => a.progress >= 100) ? 'var(--danger)' : 'var(--warning)',
              }}>
                {budgetStatus.alerts.some(a => a.progress >= 100) ? '⚠️ 预算超支' : '⚡ 预算预警'}
              </div>
              {budgetStatus.alerts.slice(0, 3).map((a) => (
                <div key={a.category_id}
                  onClick={() => navigate(`/budgets?focus=${encodeURIComponent(a.category_id)}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '13px', marginBottom: '6px', cursor: 'pointer',
                    color: a.progress >= 100 ? 'var(--danger)' : 'var(--warning)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  {getCategoryIcon(a.category_id)} {getCategoryName(a.category_id)}
                  <span style={{ color: 'var(--muted)', marginLeft: '4px' }}>
                    预算 ¥{a.budget.toLocaleString('zh-CN')} / 已花 ¥{a.spent.toLocaleString('zh-CN')}
                  </span>
                  <span style={{ marginLeft: 'auto', fontWeight: 600, color: a.progress >= 100 ? 'var(--danger)' : 'var(--warning)' }}>
                    {a.progress}%
                  </span>
                </div>
              ))}
              {budgetStatus.alerts.length > 3 && (
                <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
                  还有 {budgetStatus.alerts.length - 3} 个分类超支...
                </p>
              )}
              <div style={{ marginTop: '12px' }}>
                <Button
                  onClick={() => {
                    const firstAlertCategory = budgetStatus.alerts[0]?.category_id
                    navigate(`/budgets${firstAlertCategory ? `?focus=${encodeURIComponent(firstAlertCategory)}` : ''}`)
                  }}
                  style={{ fontSize: '13px' }}
                >前往调整预算</Button>
              </div>
            </div>
          )}

          {/* 各分类预算进度条 */}
          {budgetStatus.categories.length > 0 && (
            <div style={{ marginTop: hasAlerts ? '8px' : '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              {budgetStatus.categories.map((cat) => (
                <BudgetProgressBar
                  key={cat.category_id}
                  categoryName={cat.category_name}
                  categoryIcon={cat.category_icon}
                  spent={cat.spent}
                  budget={cat.budget}
                  progress={cat.progress}
                  clickable={true}
                  onClick={() => handleBudgetNavigate(cat.category_id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* 3. 最近交易 */}
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        本月最近交易
        <Tooltip content="近5个交易">
          <span style={{ display: 'inline-flex', cursor: 'help', color: 'var(--muted)' }}>
            <Info size={14} />
          </span>
        </Tooltip>
      </h2>
      {recentLoading ? (
        <>
          <Skeleton height="56px" marginBottom="8px" />
          <Skeleton height="56px" marginBottom="8px" />
          <Skeleton height="56px" marginBottom="8px" />
        </>
      ) : recentTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>暂无交易记录</p>
          <Button onClick={() => navigate('/add?type=expense')} style={{ marginTop: '16px' }}>
            添加第一笔交易
          </Button>
        </div>
      ) : (
        <TransactionsList transactions={recentTransactions} dateMode="dashboard" />
      )}
    </div>
  )
}

export default Dashboard
