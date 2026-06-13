import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { formatAmount } from '../../utils/common'
import { getTransactions } from '../../services/api'
import { fetchSummary } from '../../services/statisticsApi'
import { fetchBudgetStatus } from '../../services/budgetsApi'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useBook } from '../../hooks/useBook'
import { Skeleton } from '../../components/ui/Skeleton'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()
  const { hasBooks } = useBook()

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(new Date(), 'yyyy-MM-dd')
  const monthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd')

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
            {/* 本月结余 - Hero 骨架 */}
            <div className="stat-card hero" style={{ opacity: 0.95 }}>
              <Skeleton width="50%" height="12px" marginBottom="10px" />
              <Skeleton width="70%" height="26px" marginBottom="6px" />
              <Skeleton width="35%" height="11px" />
            </div>
            {/* 本月收入 - 骨架 */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon inc" style={{ opacity: 0.6 }} />
              </div>
              <Skeleton width="50%" height="12px" marginBottom="10px" />
              <Skeleton width="70%" height="26px" marginBottom="6px" />
              <Skeleton width="30%" height="11px" />
            </div>
            {/* 本月支出 - 骨架 */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon exp" style={{ opacity: 0.6 }} />
              </div>
              <Skeleton width="50%" height="12px" marginBottom="10px" />
              <Skeleton width="70%" height="26px" marginBottom="6px" />
              <Skeleton width="30%" height="11px" />
            </div>
          </>
        ) : (
          <>
            {/* 本月结余 - Hero卡片 */}
            <div className="stat-card hero">
              <div className="stat-label">本月结余</div>
              <div className="stat-value">{formatAmount(summary?.balance || 0)}</div>
              <div className="stat-sub">共 {recentTransactions.length} 笔</div>
            </div>
            {/* 本月收入 */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon inc">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  </svg>
                </div>
              </div>
              <div className="stat-label">本月收入</div>
              <div className="stat-value">{formatAmount(summary?.totalIncome || 0)}</div>
              <div className="stat-sub">{summary?.incomeCount || 0} 笔</div>
            </div>
            {/* 本月支出 */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon exp">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  </svg>
                </div>
              </div>
              <div className="stat-label">本月支出</div>
              <div className="stat-value">{formatAmount(summary?.totalExpense || 0)}</div>
              <div className="stat-sub">{summary?.expenseCount || 0} 笔</div>
            </div>
          </>
        )}
      </div>

      {/* 第一行：最近交易 + 预算进度 */}
      <div className="dash-grid">
        {/* 左侧 - 最近交易 */}
        <div className="dash-card">
          <div className="card-header">
            <h3>最近交易</h3>
            <span className="card-action" onClick={() => navigate('/transactions')}>查看全部→</span>
          </div>
          {recentLoading ? (
            <div className="txn-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="txn-row" style={{ cursor: 'default' }}>
                  <div className="txn-icon" style={{ opacity: 0.4 }} />
                  <div className="txn-info">
                    <Skeleton width="55%" height="13px" marginBottom="4px" />
                    <Skeleton width="35%" height="11px" />
                  </div>
                  <Skeleton width="60px" height="14px" />
                </div>
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--fg3)' }}>
              <p>暂无交易记录</p>
              <button className="btn btn-primary" onClick={() => navigate('/add?type=expense')} style={{ marginTop: '16px' }}>
                添加第一笔交易
              </button>
            </div>
          ) : (
            <div className="txn-list">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="txn-row" onClick={() => navigate(`/transactions?focus=${txn.id}`)}>
                  <div className="txn-icon">
                    {getCategoryIcon(txn.category)}
                  </div>
                  <div className="txn-info">
                    <div className="txn-title">{txn.description || getCategoryName(txn.category)}</div>
                    <div className="txn-meta">
                      <span>{getCategoryName(txn.category)}</span>
                      <span>{format(new Date(txn.date), 'MM-dd')} {txn.time ? txn.time : format(new Date(txn.created_at), 'HH:mm')}</span>
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
        </div>

        {/* 右侧 - 预算进度 */}
        {budgetLoading ? (
          <div className="dash-card">
            <div className="card-header">
              <Skeleton width="30%" height="14px" />
              <Skeleton width="18%" height="12px" />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <Skeleton width="30%" height="12px" />
                  <Skeleton width="20%" height="12px" />
                </div>
                <Skeleton width="100%" height="4px" borderRadius="2px" />
              </div>
            ))}
          </div>
        ) : hasBudget ? (
          <div className="dash-card">
            <div className="card-header">
              <h3>预算进度</h3>
              <span className="card-action" onClick={() => navigate('/budgets')}>管理→</span>
            </div>
            {/* 分类预算 */}
            {budgetStatus.categories.slice(0, 4).map((cat) => (
              <div key={cat.category_id} className="budget-item" onClick={() => navigate(`/budgets?focus=${cat.category_id}`)} style={{ cursor: 'pointer' }}>
                <div className="budget-info">
                  <span className="budget-name">{cat.category_icon} {cat.category_name}</span>
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
                <div className="budget-percent">{cat.progress}% {cat.progress >= 100 ? '超支!' : ''}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dash-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg3)', fontSize: '13px' }}>
            暂无预算设置
          </div>
        )}
      </div>

      {/* 第二行：快捷操作 */}
      <div className="quick-actions">
        <div className="quick-action" onClick={() => navigate('/add')}>
          <div className="qa-icon add">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
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
