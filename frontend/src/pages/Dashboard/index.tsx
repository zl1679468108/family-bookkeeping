import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { monthBoundsFromDate } from '../../utils/reportPeriod'
import { formatAmount } from '../../utils/common'
import { formatMonthDay } from '../../utils/date'
import { formatMoney, getBudgetVariant,
  BUDGET_LABEL_OVER,
  BUDGET_LABEL_REMAINING,
} from '../../utils/budget'
import { useBudgetProgress } from '../../hooks/useBudgetProgress'
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
import { EmptyAddTransactionAction } from '../../components/ui/EmptyState/emptyActions'
import { queryKeys } from '../../utils/queryKeys'
import { GC_TIME_LONG, STALE } from '../../utils/cachePolicy'
import { EMPTY_TRANSACTIONS_HOME, EMPTY_NO_BUDGET } from '../../utils/emptyCopy'
import { TITLE_BUDGET_MONTH, TITLE_RECENT_TXN_MONTH } from '../../utils/sectionCopy'
import { ACTION_VIEW_ALL,
  ACTION_GO_SETTINGS,
} from '../../utils/actionCopy'
import { FIELD_MONTH_BALANCE, FIELD_MONTH_INCOME, FIELD_MONTH_EXPENSE } from '../../utils/fieldCopy'
import { HOME_RECENT_TX_PAGE_SIZE } from '../../utils/pagination'
import { ENTITY_TRANSACTION, transactionCountLabel, totalTransactionCountLabel } from '../../utils/entityCopy'
import {
  buildTxnAmountClassName,
} from '../../utils/transactionDisplay'
import {
  buildBudgetSummaryClassName,
  buildBudgetSummaryPctClassName,
  buildBudgetSummaryFillClassName,
  buildBudgetItemClassName,
  buildBudgetItemBadgeClassName,
  buildBudgetItemFillClassName,
} from '../../utils/budgetDisplay'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { hasBooks, currentBook } = useBook()
  const bookId = currentBook?.id || ''
  const { getCategoryIconNode } = useCategoryLookup()

  // 关键：缓存本月日期范围字符串。若每次渲染都重新 format，
  // 依赖这些值的 useQuery queryKey 会每次不同，触发重复请求
  const { monthStart, monthEnd, monthStr } = useMemo(() => {
    const bounds = monthBoundsFromDate(new Date())
    return {
      monthStart: bounds.startDate,
      monthEnd: bounds.endDate,
      monthStr: bounds.startDate,
    }
  }, [])

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.statistics.summary(bookId, monthStart, monthEnd),
    queryFn: () => fetchSummary({ startDate: monthStart, endDate: monthEnd }),
    enabled: hasBooks && !!bookId,
    staleTime: STALE.statistics,
    gcTime: GC_TIME_LONG,
  })

  const { data: recentPaginated, isLoading: recentLoading } = useQuery({
    queryKey: queryKeys.transactions.recent(bookId, monthStart, monthEnd),
    queryFn: () => getTransactions({ pageSize: HOME_RECENT_TX_PAGE_SIZE, startDate: monthStart, endDate: monthEnd }),
    enabled: hasBooks && !!bookId,
    staleTime: STALE.transactions,
  })

  const { data: budgetStatus, isLoading: budgetLoading } = useQuery({
    queryKey: queryKeys.budgets.status(bookId, monthStr),
    queryFn: () => fetchBudgetStatus(monthStr),
    enabled: hasBooks && !!bookId,
    staleTime: STALE.budgets,
  })

  const recentTransactions = recentPaginated?.data || []
  const hasBudget = budgetStatus && budgetStatus.totalBudget > 0

  const { overallVariant, topCategories: topBudgetCategories } = useBudgetProgress(
    budgetStatus?.overallProgress,
    budgetStatus?.categories,
    4,
  )

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
              label={FIELD_MONTH_BALANCE}
              value={formatAmount(summary?.balance || 0)}
              sub={totalTransactionCountLabel((summary?.incomeCount || 0) + (summary?.expenseCount || 0))}
              variant="hero"
            />
            <StatCard
              label={FIELD_MONTH_INCOME}
              value={formatAmount(summary?.totalIncome || 0)}
              sub={transactionCountLabel(summary?.incomeCount || 0)}
              variant="income"
            />
            <StatCard
              label={FIELD_MONTH_EXPENSE}
              value={formatAmount(summary?.totalExpense || 0)}
              sub={transactionCountLabel(summary?.expenseCount || 0)}
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
            title={recentLoading ? <Skeleton width="70px" height="14px" /> : TITLE_RECENT_TXN_MONTH}
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
              description={EMPTY_TRANSACTIONS_HOME}
              action={
                <EmptyAddTransactionAction
                  onClick={() => navigate('/add?type=expense')}
                />
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
                    <div className="txn-title">{txn.description || ENTITY_TRANSACTION}</div>
                    <div className="txn-meta">
                      <span>{formatMonthDay(txn.date)}</span>
                    </div>
                  </div>
                  <div className={buildTxnAmountClassName({ type: txn.type, prefix: 'txn-amount' })}>
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
          <Card className="dash-budget-card">
            <CardHeader title={TITLE_BUDGET_MONTH} />
            <div className="dash-budget-summary dash-budget-summary--skeleton">
              <Skeleton width="40%" height="12px" marginBottom="10px" />
              <Skeleton width="100%" height="8px" borderRadius="999px" marginBottom="10px" />
              <Skeleton width="70%" height="11px" />
            </div>
            <div className="dash-budget-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="dash-budget-item" style={{ pointerEvents: 'none' }}>
                  <div className="dash-budget-item__icon">
                    <Skeleton width="100%" height="100%" borderRadius="10px" />
                  </div>
                  <div className="dash-budget-item__body">
                    <div className="dash-budget-item__top">
                      <Skeleton width="40%" height="13px" />
                      <Skeleton width="36px" height="18px" borderRadius="999px" />
                    </div>
                    <Skeleton width="55%" height="11px" marginBottom="8px" />
                    <Skeleton width={[70, 45, 90][i] + '%'} height="6px" borderRadius="999px" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : hasBudget ? (
          <Card className="dash-budget-card">
            <CardHeader
              title={TITLE_BUDGET_MONTH}
              action={
                <Button type="button" variant="ghost" size="sm" className="card-action" onClick={() => navigate('/budgets')}>
                  {ACTION_VIEW_ALL}
                </Button>
              }
            />

            <div className={buildBudgetSummaryClassName({ variant: overallVariant })}>
              <div className="dash-budget-summary__row">
                <span className="dash-budget-summary__label">本月总进度</span>
                <span className={buildBudgetSummaryPctClassName({ variant: overallVariant })}>
                  {budgetStatus.overallProgress}%
                </span>
              </div>
              <div className="dash-budget-summary__bar">
                <div
                  className={buildBudgetSummaryFillClassName({ variant: overallVariant })}
                  style={{ width: `${Math.min(budgetStatus.overallProgress, 100)}%` }}
                />
              </div>
              <div className="dash-budget-summary__meta">
                <span>
                  已用 <strong>{formatMoney(budgetStatus.totalSpent, { compact: true })}</strong>
                </span>
                <span className="dash-budget-summary__dot">·</span>
                <span>
                  预算 <strong>{formatMoney(budgetStatus.totalBudget, { compact: true })}</strong>
                </span>
                <span className="dash-budget-summary__dot">·</span>
                <span className={budgetStatus.remaining < 0 ? 'is-over' : ''}>
                  {budgetStatus.remaining < 0 ? BUDGET_LABEL_OVER : BUDGET_LABEL_REMAINING}{' '}
                  <strong>{formatMoney(Math.abs(budgetStatus.remaining), { compact: true })}</strong>
                </span>
              </div>
            </div>

            <div className="dash-budget-list">
              {topBudgetCategories.map((cat) => {
                const variant = getBudgetVariant(cat.progress)
                return (
                  <div
                    key={cat.category_id}
                    className={buildBudgetItemClassName({ variant })}
                    onClick={() => navigate(`/budgets?focus=${cat.category_id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/budgets?focus=${cat.category_id}`)
                      }
                    }}
                  >
                    <div className="dash-budget-item__icon">
                      {renderCategoryIcon(cat.category_icon, { size: 18 })}
                    </div>
                    <div className="dash-budget-item__body">
                      <div className="dash-budget-item__top">
                        <span className="dash-budget-item__name">{cat.category_name}</span>
                        <span className={buildBudgetItemBadgeClassName({ variant })}>
                          {variant === 'danger' ? BUDGET_LABEL_OVER : `${cat.progress}%`}
                        </span>
                      </div>
                      <div className="dash-budget-item__meta">
                        <span className="dash-budget-item__amount">
                          <em>{formatMoney(cat.spent, { compact: true })}</em>
                          <span className="dash-budget-item__sep">/</span>
                          {formatMoney(cat.budget, { compact: true })}
                        </span>
                        {variant === 'danger' && (
                          <span className="dash-budget-item__pct">{cat.progress}%</span>
                        )}
                      </div>
                      <div className="dash-budget-item__bar">
                        <div
                          className={buildBudgetItemFillClassName({ variant })}
                          style={{ width: `${Math.min(Math.max(cat.progress, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          <Card className="dash-budget-card">
            <CardHeader title={TITLE_BUDGET_MONTH} />
            <EmptyState
              description={EMPTY_NO_BUDGET}
              action={
                <Button variant="primary" onClick={() => navigate('/budgets')}>
                  {ACTION_GO_SETTINGS}
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
