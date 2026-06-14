import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { getTransactions, deleteTransaction } from '../../services/api'
import { useCategoryLookup, useCategories } from '../../hooks/useCategories'
import { useDebounce } from '../../hooks/useDebounce'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useFocusItem } from '../../hooks/useFocusItem'
import { formatAmount, formatAmountWithType } from '../../utils/common'
import { Skeleton } from '../../components/ui/Skeleton'
import { DetailModal } from '../../components/DetailModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { notify } from '../../utils/notifications'
import { useQueryClient } from '@tanstack/react-query'

const PAGE_SIZE = 20

const parseImageList = (tx: any): string[] => {
  if (tx?.image_url_list && Array.isArray(tx.image_url_list) && tx.image_url_list.length > 0) {
    return tx.image_url_list
  }
  if (tx?.image_urls) {
    try {
      const parsed = JSON.parse(tx.image_urls)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      if (typeof tx.image_urls === 'string' && tx.image_urls.includes(',')) {
        return tx.image_urls.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
    }
  }
  if (tx?.image_url) return [tx.image_url]
  return []
}

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()
  const { focusId, hasFocus, HIGHLIGHT_CLASS } = useFocusItem()

  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const todayStr = format(today, 'yyyy-MM-dd')

  // 获取分类列表（用于分类下拉框）
  const { data: allCategories = [] }: any = useCategories()

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(() => {
    const t = searchParams.get('type')
    return (t as 'all' | 'income' | 'expense') || 'all'
  })
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 800)

  // 分类下拉框选项（与当前类型联动）
  const categoryOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [{ value: '', label: '全部分类' }]
    allCategories
      .filter((c: any) => typeFilter === 'all' || c.type === typeFilter)
      .forEach((c: any) => opts.push({ value: c.id, label: `${c.icon || ''} ${c.name}` }))
    return opts
  }, [typeFilter, allCategories])

  // 类型变化时：若已选分类与新类型不匹配，则清空分类
  const handleTypeChange = (newType: 'all' | 'income' | 'expense') => {
    setTypeFilter(newType)
    if (categoryFilter) {
      const matched = allCategories.find((c: any) => c.id === categoryFilter)
      if (matched && newType !== 'all' && matched.type !== newType) {
        setCategoryFilter('')
      }
    }
  }

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
    queryKey: ['transactions', typeFilter, categoryFilter, effectiveStartDate, todayStr, debouncedSearch, page],
    queryFn: () => getTransactions({
      type: typeFilter !== 'all' ? typeFilter : undefined,
      category: categoryFilter || undefined,
      startDate: effectiveStartDate || undefined,
      endDate: todayStr,
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
      <div className="filter-sticky">
        <div className="filter-bar">
          <div className="srch-wrap">
            <span className="si">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input type="text" placeholder="搜索描述/品牌..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value as 'all' | 'income' | 'expense')}
          >
            <option value="all">全部类型</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'week' | 'month')}
          >
            <option value="all">全部时间</option>
            <option value="week">近 7 天</option>
            <option value="month">近 30 天</option>
          </select>

          <span className="filter-summary">
            {transactions.length}笔 · 支出{formatAmount(totalExpense)} · 收入{formatAmount(totalIncome)}
          </span>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="dash-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}><Skeleton width="40%" height="12px" /></th>
                  <th style={{ width: 120 }}><Skeleton width="50%" height="12px" /></th>
                  <th style={{ width: 120 }}><Skeleton width="50%" height="12px" /></th>
                  <th><Skeleton width="60%" height="12px" /></th>
                  <th style={{ textAlign: 'right', width: 120 }}><Skeleton width="40%" height="12px" /></th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} style={{ cursor: 'default' }}>
                    <td><Skeleton width="50%" height="13px" /></td>
                    <td><Skeleton width="60%" height="13px" /></td>
                    <td><Skeleton width="40%" height="13px" /></td>
                    <td><Skeleton width="70%" height="13px" /></td>
                    <td style={{ textAlign: 'right' }}><Skeleton width="55%" height="13px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <table className="data-table txn-table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>日期</th>
                  <th style={{ width: 120 }}>分类</th>
                  <th style={{ width: 120 }}>品牌</th>
                  <th>描述</th>
                  <th style={{ textAlign: 'right', width: 120 }}>金额</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const imgs = parseImageList(t)
                  return (
                    <tr
                      key={t.id}
                      data-focus={t.id}
                      onClick={() => { setSelectedTransaction(t); setShowDetail(true) }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{format(new Date(t.date), 'yyyy-MM-dd')}</td>
                      <td><span className="cell-cat">{getCategoryIcon(t.category)} {getCategoryName(t.category)}</span></td>
                      <td>
                        {(t as any).brand ? (
                          <span className="brand-tag">{(t as any).brand}</span>
                        ) : (
                          <span style={{ color: 'var(--fg3)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="cell-desc" title={t.description || getCategoryName(t.category)}>
                          {t.description || getCategoryName(t.category)}
                        </span>
                      </td>
                      <td className={`cell-amount ${t.type === 'expense' ? 'debit' : 'credit'}`}>
                        {formatAmountWithType(t.amount, t.type === 'income')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

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
                {selectedTransaction.type === 'expense' ? '支出' : '收入'} · {format(new Date(selectedTransaction.date), 'yyyy-MM-dd')}
              </div>
              <div className="detail-amount">
                <div className={`detail-amount-value ${selectedTransaction.type === 'income' ? 'income' : ''}`}>
                  {formatAmountWithType(selectedTransaction.amount, selectedTransaction.type === 'income')}
                </div>
              </div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            {(selectedTransaction as any).brand && (
              <div className="detail-item">
                <span className="detail-item-label">品牌</span>
                <span className="detail-item-value">{(selectedTransaction as any).brand}</span>
              </div>
            )}
            {selectedTransaction.description && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-item-label">描述</span>
                <span className="detail-item-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedTransaction.description}</span>
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
                <span className="detail-item-value">{format(new Date(selectedTransaction.created_at), 'yyyy-MM-dd')}</span>
              </div>
            )}
          </div>

          {(() => {
            const imgs = parseImageList(selectedTransaction)
            if (imgs.length === 0) return null
            return (
              <>
                <div className="detail-divider" />
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-item-label">附件（{imgs.length}）</span>
                  <div className="detail-image-grid">
                    {imgs.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-image-item"
                      >
                        <img src={url} alt={`附件 ${idx + 1}`} />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}
        </DetailModal>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这笔交易吗？"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
        }}
        loading={deleteLoading}
      />
    </div>
  )
}

export default Transactions
