import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format, parse } from 'date-fns'
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
    staleTime: 5 * 60 * 1000, // T-M5: 5 分钟内不重新请求
  })

  const { data: recentPaginated, isLoading: recentLoading } = useQuery({
    queryKey: ['transactions', 'recent', monthStart, monthEnd],
    queryFn: () => getTransactions({ pageSize: 5, startDate: monthStart, endDate: monthEnd }),
    enabled: hasBooks,
    staleTime: 5 * 60 * 1000, // T-M5: 5 分钟内不重新请求
  })

  const { data: budgetStatus, isLoading: budgetLoading } = useQuery({
    queryKey: ['budgets', 'status', monthStr],
    queryFn: () => fetchBudgetStatus(monthStr),
    enabled: hasBooks,
    staleTime: 5 * 60 * 1000, // T-M5: 5 分钟内不重新请求
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
              sub={`共 ${(summary?.incomeCount || 0) + (summary?.expenseCount || 0)} 笔`}
              variant="hero"
            />
            <StatCard
              label="本月收入"
              value={formatAmount(summary?.totalIncome || 0)}
              sub={`${summary?.incomeCount || 0} 笔`}
              variant="income"
            />
            <StatCard
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
            title={recentLoading ? <Skeleton width="70px" height="14px" /> : "本月最近交易"}
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
                      <span>{format(parse(txn.date, 'yyyy-MM-dd', new Date()), 'MM-dd')}</span>
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


    </div>
  )
}

export default Dashboard
