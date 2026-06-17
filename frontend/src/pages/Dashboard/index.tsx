import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { formatAmount } from '../../utils/common'
import { getTransactions } from '../../services/api'
import { fetchSummary } from '../../services/statisticsApi'
import { fetchBudgetStatus } from '../../services/budgetsApi'
import { useBook } from '../../hooks/useBook'
import { useCategoryLookup } from '../../hooks/useCategories'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import { Skeleton } from '../../components/ui/Skeleton'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { hasBooks } = useBook()
  const { getCategoryIconNode } = useCategoryLookup()

  // 关键：缓存本月日期范围字符串。若每次渲染都重新 format，
  // 依赖这些值的 useQuery queryKey 会每次不同，触发重复请求
  const { monthStart, monthEnd, monthStr } = useMemo(() => {
    const now = new Date()
    return {
      monthStart: format(startOfMonth(now), 'yyyy-MM-dd'),
      monthEnd: format(endOfMonth(now), 'yyyy-MM-dd'),
      monthStr: format(startOfMonth(now), 'yyyy-MM-dd'),
    }
  }, [])

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['statistics', 'summary', monthStart, monthEnd],
    queryFn: () => fetchSummary({ startDate: monthStart, endDate: monthEnd }),
    enabled: hasBooks,
  })

  const { data: recentPaginated, isLoading: recentLoading } = useQuery({
    queryKey: ['transactions', 'recent', monthStart, monthEnd],
    queryFn: () => getTransactions({ pageSize: 5, startDate: monthStart, endDate: monthEnd }),
    enabled: hasBooks,
  })

  const { data: budgetStatus, isLoading: budgetLoading } = useQuery({
    queryKey: ['budgets', 'status', monthStr],
    queryFn: () => fetchBudgetStatus(monthStr),
    enabled: hasBooks,
  })

  const recentTransactions = recentPaginated?.data || []
  const hasBudget = budgetStatus && budgetStatus.totalBudget > 0

  return (
    <div className="page-container">
      {/* 统计卡片行 */}
      <div className="stats-row">
        {summaryLoading ? (
          <>
            <StatCard
              label={<Skeleton width="50%" height="12px" marginBottom="6px" />}
              value={<Skeleton width="70%" height="22px" marginBottom="8px" />}
              sub={<Skeleton width="35%" height="12px" />}
              variant="hero"
            />
            <StatCard
              icon={<Skeleton width="36px" height="36px" borderRadius="10px" />}
              label={<Skeleton width="50%" height="12px" marginBottom="6px" />}
              value={<Skeleton width="70%" height="22px" marginBottom="8px" />}
              sub={<Skeleton width="30%" height="12px" />}
              variant="income"
            />
            <StatCard
              icon={<Skeleton width="36px" height="36px" borderRadius="10px" />}
              label={<Skeleton width="50%" height="12px" marginBottom="6px" />}
              value={<Skeleton width="70%" height="22px" marginBottom="8px" />}
              sub={<Skeleton width="30%" height="12px" />}
              variant="expense"
            />
          </>
        ) : (
          <>
            <StatCard
              label="本月结余"
              value={formatAmount(summary?.balance || 0)}
              sub={`共 ${recentTransactions.length} 笔`}
              variant="hero"
            />
            <StatCard
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
              }
              label="本月收入"
              value={formatAmount(summary?.totalIncome || 0)}
              sub={`${summary?.incomeCount || 0} 笔`}
              variant="income"
            />
            <StatCard
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                </svg>
              }
              label="本月支出"
              value={formatAmount(summary?.totalExpense || 0)}
              sub={`${summary?.expenseCount || 0} 笔`}
              variant="expense"
            />
          </>
        )}
      </div>

      {/* 第一行：最近交易 + 预算进度 */}
      <div className="dash-grid">
        {/* 左侧 - 最近交易 */}
        <Card>
          <CardHeader
            title={recentLoading ? <Skeleton width="70px" height="14px" /> : "最近交易"}
            action={
              recentLoading ? (
                <Skeleton width="60px" height="12px" />
              ) : (
                <span
                  className="card-action"
                  onClick={() => navigate('/transactions')}
                  style={{ cursor: 'pointer' }}
                >
                  查看全部→
                </span>
              )
            }
          />
          {recentLoading ? (
            <div className="txn-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="txn-row" style={{ cursor: 'default' }}>
                  <div className="txn-icon">
                    <Skeleton width="100%" height="100%" borderRadius="8px" />
                  </div>
                  <div className="txn-info">
                    <Skeleton width="55%" height="13px" marginBottom="4px" />
                    <Skeleton width="35%" height="11px" />
                  </div>
                  <Skeleton width="60px" height="14px" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              icon="📭"
              title="暂无交易记录"
              action={
                <Button
                  variant="primary"
                  onClick={() => navigate('/add?type=expense')}
                >
                  添加第一笔交易
                </Button>
              }
            />
          ) : (
            <div className="txn-list">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="txn-row"
                  onClick={() => navigate(`/transactions?focus=${txn.id}`)}
                >
                  <div className="txn-icon">{getCategoryIconNode(txn.category, 24)}</div>
                  <div className="txn-info">
                    <div className="txn-title">{txn.description || '交易'}</div>
                    <div className="txn-meta">
                      <span>{format(new Date(txn.date), 'MM-dd')}</span>
                    </div>
                  </div>
                  <div className={`txn-amount ${txn.type === 'expense' ? 'debit' : 'credit'}`}>
                    <span className="txn-sign">{txn.type === 'expense' ? '−' : '+'}</span>
                    {formatAmount(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 右侧 - 预算进度 */}
        {budgetLoading ? (
          <Card>
            <CardHeader
              title={<Skeleton width="70px" height="14px" />}
              action={<Skeleton width="50px" height="12px" />}
            />
            {[0, 1, 2].map((i) => (
              <div key={i} className="budget-item" style={{ pointerEvents: 'none' }}>
                <div className="budget-info">
                  <Skeleton width="30%" height="13px" />
                  <Skeleton width="25%" height="12px" />
                </div>
                <div className="budget-bar">
                  <Skeleton width={[60, 85, 45][i] + '%'} height="5px" borderRadius="3px" />
                </div>
                <Skeleton width="20%" height="11px" />
              </div>
            ))}
          </Card>
        ) : hasBudget ? (
          <Card>
            <CardHeader
              title="预算进度"
              action={
                <span
                  className="card-action"
                  onClick={() => navigate('/budgets')}
                  style={{ cursor: 'pointer' }}
                >
                  管理→
                </span>
              }
            />
            {budgetStatus.categories.slice(0, 4).map((cat) => (
              <div
                key={cat.category_id}
                className="budget-item"
                onClick={() => navigate(`/budgets?focus=${cat.category_id}`)}
              >
                <div className="budget-info">
                  <span className="budget-name">
                    <span style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}>
                      {renderCategoryIcon(cat.category_icon, { size: 18 })}
                    </span>
                    {cat.category_name}
                  </span>
                  <span className="budget-amount">
                    ¥{cat.spent.toLocaleString('zh-CN')} / ¥{cat.budget.toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="budget-bar">
                  <div
                    className={`fill ${cat.progress >= 100 ? 'danger' : cat.progress >= 80 ? 'warn' : 'safe'}`}
                    style={{ width: `${Math.min(cat.progress, 105)}%` }}
                  />
                </div>
                <div className="budget-percent">
                  {cat.progress}% {cat.progress >= 100 ? '超支!' : ''}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon="📊"
              title="暂无预算设置"
              description="设置预算可以更好地控制支出"
              action={
                <Button variant="primary" onClick={() => navigate('/budgets')}>
                  去设置
                </Button>
              }
            />
          </Card>
        )}
      </div>

      {/* 第二行：快捷操作 */}
      <div className="quick-actions">
        <div className="quick-action" onClick={() => navigate('/add')}>
          <div className="qa-icon add">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="qa-info">
            <h4>记一笔</h4>
            <p>快速记录一笔新交易</p>
          </div>
        </div>
        <div className="quick-action" onClick={() => navigate('/reports')}>
          <div className="qa-icon report">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>
          <div className="qa-info">
            <h4>查看报表</h4>
            <p>分析消费趋势与分类</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
