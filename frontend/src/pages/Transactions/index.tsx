import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { getTransactions, deleteTransaction } from '../../services/api'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useDebounce } from '../../hooks/useDebounce'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useFocusItem } from '../../hooks/useFocusItem'
import { formatAmount } from '../../utils/common'
import { Skeleton } from '../../components/ui/Skeleton'
import { DetailModal } from '../../components/DetailModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { notify } from '../../utils/notifications'
import { useQueryClient } from '@tanstack/react-query'

const PAGE_SIZE = 20

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()
  const { focusId, hasFocus, HIGHLIGHT_CLASS } = useFocusItem()

  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const todayStr = format(today, 'yyyy-MM-dd')

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(() => {
    const t = searchParams.get('type')
    return (t as 'all' | 'income' | 'expense') || 'all'
  })
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  // 详情弹窗状态
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { run: handleDelete, isRunning: deleteLoading } = useDebouncedAction(async () => {
    await deleteTransaction(selectedTransaction.id)
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['statistics'] })
    setShowDetail(false)
    setShowDeleteConfirm(false)
    notify({ type: 'success', message: '交易已删除' })
  })

  const effectiveStartDate = useMemo(() => {
    if (dateFilter === 'week') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return format(d, 'yyyy-MM-dd')
    }
    if (dateFilter === 'month') return monthStart
    return ''
  }, [dateFilter, monthStart])

  const { data: paginated, isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, effectiveStartDate, todayStr, debouncedSearch, page],
    queryFn: () => getTransactions({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      startDate: effectiveStartDate || undefined,
      endDate: todayStr,
      search: debouncedSearch || undefined,
      keyword: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  })

  const transactions = paginated?.data || []
  const total = paginated?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="page-container">
      {/* 筛选栏 */}
      <div className="filter-sticky">
        <div className="filter-bar">
          <div className="srch-wrap">
            <span className="si">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input type="text" placeholder="搜索..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>全部</div>
          <div className={`filter-chip ${typeFilter === 'expense' ? 'active' : ''}`} onClick={() => setTypeFilter('expense')}>支出</div>
          <div className={`filter-chip ${typeFilter === 'income' ? 'active' : ''}`} onClick={() => setTypeFilter('income')}>收入</div>
          <div className={`filter-chip ${dateFilter === 'all' ? 'active' : ''}`} onClick={() => setDateFilter('all')}>全部</div>
          <div className={`filter-chip ${dateFilter === 'week' ? 'active' : ''}`} onClick={() => setDateFilter('week')}>近7天</div>
          <div className={`filter-chip ${dateFilter === 'month' ? 'active' : ''}`} onClick={() => setDateFilter('month')}>本月</div>
          <span className="filter-summary">
            {transactions.length}笔 · 支出{formatAmount(totalExpense)} · 收入{formatAmount(totalIncome)}
          </span>
        </div>
      </div>

      {/* 数据表格 */}
      {isLoading ? (
        <>
          <div className="dash-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th><Skeleton width="40%" height="12px" /></th>
                  <th><Skeleton width="50%" height="12px" /></th>
                  <th><Skeleton width="60%" height="12px" /></th>
                  <th style={{ textAlign: 'right' }}><Skeleton width="40%" height="12px" /></th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} style={{ cursor: 'default' }}>
                    <td><Skeleton width="50%" height="13px" /></td>
                    <td><Skeleton width="60%" height="13px" /></td>
                    <td><Skeleton width="70%" height="13px" /></td>
                    <td style={{ textAlign: 'right' }}><Skeleton width="55%" height="13px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 分页骨架 */}
          <div className="pagination-bar" style={{ opacity: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
              <Skeleton width="120px" height="12px" />
              <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
            </div>
          </div>
        </>
      ) : transactions.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--fg3)' }}>
          <p>暂无交易记录</p>
          <button className="btn btn-primary" onClick={() => navigate('/add?type=expense')} style={{ marginTop: '16px' }}>
            添加第一笔交易
          </button>
        </div>
      ) : (
        <>
          <div className="dash-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>分类</th>
                  <th>描述</th>
                  <th style={{ textAlign: 'right' }}>金额</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} data-focus={t.id} onClick={() => { setSelectedTransaction(t); setShowDetail(true) }} style={{ cursor: 'pointer' }}>
                    <td>{format(new Date(t.date), 'MM-dd')}</td>
                    <td><span className="cell-cat">{getCategoryIcon(t.category)} {getCategoryName(t.category)}</span></td>
                    <td>{t.description || getCategoryName(t.category)}</td>
                    <td className={`cell-amount ${t.type === 'expense' ? 'debit' : 'credit'}`}>
                      {t.type === 'expense' ? '−' : '+'}{formatAmount(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </button>
              <span className="page-info">
                第 {page} / {totalPages} 页 · 共 {total} 条
              </span>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 交易详情弹窗 */}
      {selectedTransaction && (
        <DetailModal
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          title="交易详情"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { navigate(`/add?edit=${selectedTransaction.id}`); setShowDetail(false) }}>
                编辑
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除
              </button>
            </>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{getCategoryIcon(selectedTransaction.category)}</div>
            <div className="detail-content">
              <div className="detail-title">{getCategoryName(selectedTransaction.category)}</div>
              <div className="detail-subtitle">
                {selectedTransaction.type === 'expense' ? '支出' : '收入'} · {format(new Date(selectedTransaction.date), 'yyyy-MM-dd HH:mm')}
              </div>
              <div className="detail-amount">
                <div className={`detail-amount-value ${selectedTransaction.type === 'income' ? 'income' : ''}`}>
                  {selectedTransaction.type === 'expense' ? '−' : '+'}¥{formatAmount(selectedTransaction.amount)}
                </div>
              </div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            {selectedTransaction.description && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-item-label">描述</span>
                <span className="detail-item-value">{selectedTransaction.description}</span>
              </div>
            )}
            {selectedTransaction.location_name && (
              <div className="detail-item">
                <span className="detail-item-label">地点</span>
                <span className="detail-item-value">{selectedTransaction.location_name}</span>
              </div>
            )}
            {selectedTransaction.latitude && selectedTransaction.longitude && (
              <div className="detail-item">
                <span className="detail-item-label">坐标</span>
                <span className="detail-item-value">
                  {selectedTransaction.latitude}, {selectedTransaction.longitude}
                </span>
              </div>
            )}
            {selectedTransaction.poi_id && (
              <div className="detail-item">
                <span className="detail-item-label">商户 ID</span>
                <span className="detail-item-value">{selectedTransaction.poi_id}</span>
              </div>
            )}
            {selectedTransaction.book_id && (
              <div className="detail-item">
                <span className="detail-item-label">账本 ID</span>
                <span className="detail-item-value">{selectedTransaction.book_id}</span>
              </div>
            )}
            {selectedTransaction.created_at && (
              <div className="detail-item">
                <span className="detail-item-label">创建时间</span>
                <span className="detail-item-value">{format(new Date(selectedTransaction.created_at), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            )}
          </div>
          {selectedTransaction.image_url && (
            <>
              <div className="detail-divider" />
              <img src={selectedTransaction.image_url} alt="凭证" className="detail-image" />
            </>
          )}
        </DetailModal>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这笔交易吗？"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          // 不关闭详情弹窗
        }}
        loading={deleteLoading}
      />
    </div>
  )
}

export default Transactions
