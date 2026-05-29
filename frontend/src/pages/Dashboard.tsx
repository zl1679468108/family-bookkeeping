import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { Info } from 'lucide-react'
import { Header } from '../components/Header'
import { Button } from '../components/ui/button'
import { StatCard } from '../components/StatCard'
import { TransactionsList } from '../components/TransactionsList'
import { Tooltip } from '../components/ui/tooltip'
import '../styles/layout.scss'
import { formatAmount } from '../utils/common'
import { getTransactions } from '../services/api'
import { fetchSummary } from '../services/statisticsApi'
import { fetchBudgetStatus } from '../services/budgetsApi'
import { useCategoryLookup } from '../hooks/useCategories'

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

  // 本月日期范围
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(new Date(), 'yyyy-MM-dd')
  const monthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  // 1. 统计概览
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['statistics', 'summary', monthStart, monthEnd],
    queryFn: () => fetchSummary({ startDate: monthStart, endDate: monthEnd }),
  })

  // 2. 最近交易（本月，与统计口径一致）
  const { data: recentPaginated, isLoading: recentLoading } = useQuery({
    queryKey: ['transactions', 'recent', monthStart, monthEnd],
    queryFn: () => getTransactions({ pageSize: 5, startDate: monthStart, endDate: monthEnd }),
  })

  // 3. 预算状态
  const { data: budgetStatus } = useQuery({
    queryKey: ['budgets', 'status', monthStr],
    queryFn: () => fetchBudgetStatus(monthStr),
  })

  const recentTransactions = recentPaginated?.data || []
  const isLoading = summaryLoading && recentLoading

  // 预算预警数据
  const hasBudget = budgetStatus && budgetStatus.totalBudget > 0
  const hasAlerts = budgetStatus && budgetStatus.alerts.length > 0

  return (
    <div>
      <Header title="概览">
      </Header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : (
        <>
          {/* StatCards: 本月结余 / 本月收入 / 本月支出 */}
          <div className="cards-grid">
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
          </div>

          {/* 预算概览 —— 单卡，有预警时整合详情 */}
          {hasBudget && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              marginBottom: '24px',
            }}>
              {/* 标题栏 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600 }}>
                  📊 预算概览
                </h3>
              </div>

              {/* 总预算 + 进度条 + 百分比 —— 同一行 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  总预算 ¥{budgetStatus.totalBudget.toLocaleString('zh-CN')}
                </span>
                <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(budgetStatus.overallProgress, 100)}%`,
                    background: budgetStatus.overallProgress >= 100 ? 'var(--danger)' : budgetStatus.overallProgress >= 80 ? 'var(--warning)' : 'var(--success)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                  color: budgetStatus.overallProgress >= 100 ? 'var(--danger)' : budgetStatus.overallProgress >= 80 ? 'var(--warning)' : 'var(--muted)',
                }}>
                  {budgetStatus.overallProgress}%
                </span>
              </div>

              {/* 已花费 / 剩余 */}
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
                已花费 ¥{budgetStatus.totalSpent.toLocaleString('zh-CN')} / 剩余 ¥{budgetStatus.remaining.toLocaleString('zh-CN')}
              </div>

              {/* 预警详情 —— 嵌入卡片内部 */}
              {hasAlerts && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
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

                  {/* 详细条目 */}
                  {budgetStatus.alerts.slice(0, 3).map((a) => (
                    <div
                      key={a.category_id}
                      onClick={() => navigate(`/budgets?focus=${encodeURIComponent(a.category_id)}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', marginBottom: '6px', cursor: 'pointer',
                        color: a.progress >= 100 ? 'var(--danger)' : 'var(--warning)',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75' }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                    >
                      {getCategoryIcon(a.category_id)} {getCategoryName(a.category_id)}
                      <span style={{ color: 'var(--muted)', marginLeft: '4px' }}>
                        预算 ¥{a.budget.toLocaleString('zh-CN')} / 已花 ¥{a.spent.toLocaleString('zh-CN')}
                      </span>
                      <span style={{
                        marginLeft: 'auto', fontWeight: 600,
                        color: a.progress >= 100 ? 'var(--danger)' : 'var(--warning)',
                      }}>
                        {a.progress}%
                      </span>
                    </div>
                  ))}
                  {budgetStatus.alerts.length > 3 && (
                    <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
                      还有 {budgetStatus.alerts.length - 3} 个分类超支...
                    </p>
                  )}

                  {/* 底部操作 */}
                  <div style={{ marginTop: '12px' }}>
                    <Button
                      onClick={() => {
                        const firstAlertCategory = budgetStatus.alerts[0]?.category_id
                        const focusParam = firstAlertCategory ? `?focus=${encodeURIComponent(firstAlertCategory)}` : ''
                        navigate(`/budgets${focusParam}`)
                      }}
                      style={{ fontSize: '13px' }}
                    >
                      前往调整预算
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 本月最近交易 */}
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            本月最近交易
            <Tooltip content="近5个交易">
              <span style={{ display: 'inline-flex', cursor: 'help', color: 'var(--muted)' }}>
                <Info size={14} />
              </span>
            </Tooltip>
          </h2>
          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>暂无交易记录</p>
              <Button onClick={() => navigate('/add?type=expense')} style={{ marginTop: '16px' }}>
                添加第一笔交易
              </Button>
            </div>
          ) : (
            <TransactionsList
              transactions={recentTransactions}
              dateMode="dashboard"
            />
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
