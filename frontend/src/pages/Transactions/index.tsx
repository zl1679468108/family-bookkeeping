import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { startOfMonth, format } from 'date-fns'
import { Header } from '../../components/Header'
import { Button } from '../../components/ui/button'
import { FilterBar } from '../../components/FilterBar'
import { FilterPanel } from '../../components/FilterPanel'
import { TransactionsList } from '../../components/TransactionsList'
import { TransactionListSkeleton } from '../../components/ui/Skeleton'
import { BatchActionBar } from '../../components/BatchActionBar'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { getTransactions, deleteTransaction, batchTransactions } from '../../services/api'
import type { BatchRequest } from '../../types/batch'
import { useCategories } from '../../hooks/useCategories'
import { useBook } from '../../hooks/useBook'
import { useIsOwner } from '../../hooks/useIsOwner'
import { formatAmount } from '../../utils/common'
import { notify } from '../../utils/notifications'

const buildAddUrl = (type: string, category: string): string => {
  const params = new URLSearchParams()
  if (type && type !== 'all') params.append('type', type)
  if (category) params.append('category', category)
  return `/add${params.toString() ? '?' + params.toString() : ''}`
}

interface DeleteTarget {
  id: number
}

interface ActiveChip {
  label: string
  onRemove: () => void
}

const PAGE_SIZE = 10

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const { currentBook } = useBook()
  const { isOwner } = useIsOwner(currentBook?.id || null)
  const [viewMode, setViewMode] = useState<'own' | 'all'>('own')

  // 从 URL searchParams 初始化筛选条件（支持饼图下钻跳转）
  // 没有指定日期时默认显示本月
  const [filter, setFilter] = useState(() => {
    const category = searchParams.get('category') || ''
    const type = (searchParams.get('type') as 'all' | 'income' | 'expense') || 'all'
    const today = new Date()
    const startDate = searchParams.get('startDate') || format(startOfMonth(today), 'yyyy-MM-dd')
    const endDate = searchParams.get('endDate') || format(today, 'yyyy-MM-dd')
    return { type, category, startDate, endDate }
  })

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // ---- Advanced filter state ----
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(false)

  // ---- 批量操作状态 ----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDialog, setBatchDialog] = useState<'category' | 'type' | 'date' | 'book' | 'delete' | null>(null)
  const [batchCategory, setBatchCategory] = useState('')
  const [batchType, setBatchType] = useState<'income' | 'expense'>('expense')
  const [batchDate, setBatchDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [batchBookId, setBatchBookId] = useState('')
  const { data: categories = [] } = useCategories()

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = (pageIds: number[]) => {
    setSelectedIds(prev => {
      const allSelected = pageIds.every(id => prev.has(id))
      const next = new Set(prev)
      if (allSelected) {
        pageIds.forEach(id => next.delete(id))
      } else {
        pageIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const batchMutation = useMutation({
    mutationFn: (req: BatchRequest) => batchTransactions(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      notify({ type: 'success', message: '批量操作成功' })
      setSelectedIds(new Set())
      setBatchDialog(null)
    },
  })

  const handleBatchAction = (operation: BatchRequest['operation']) => {
    switch (operation) {
      case 'update_category': setBatchDialog('category'); break
      case 'update_type': setBatchDialog('type'); break
      case 'update_date': setBatchDialog('date'); break
      case 'move_book': setBatchDialog('book'); break
      case 'delete': setBatchDialog('delete'); break
      default: setBatchDialog(null)
    }
  }

  const handleBatchConfirm = () => {
    const ids = Array.from(selectedIds)
    const operation = batchDialog === 'delete' ? 'delete' :
      batchDialog === 'category' ? 'update_category' :
      batchDialog === 'type' ? 'update_type' :
      batchDialog === 'date' ? 'update_date' :
      batchDialog === 'book' ? 'move_book' : 'update_category'

    const payload: Record<string, any> = {}
    if (batchDialog === 'category') payload.category_id = batchCategory
    else if (batchDialog === 'type') payload.type = batchType
    else if (batchDialog === 'date') payload.date = batchDate
    else if (batchDialog === 'book') payload.book_id = batchBookId

    batchMutation.mutate({ ids, operation, ...(Object.keys(payload).length > 0 ? { payload } : {}) })
  }

  // 筛选条件变化时重置页码
  useEffect(() => {
    setPage(1)
  }, [filter, search, minAmount, maxAmount, dateFrom, dateTo])

  // 高级筛选的日期范围优先于默认日期范围
  const effectiveStartDate = dateFrom || filter.startDate
  const effectiveEndDate = dateTo || filter.endDate

  const { data: paginated, isLoading } = useQuery({
    queryKey: ['transactions', filter.type, filter.category, effectiveStartDate, effectiveEndDate, search, page, sortOrder, minAmount, maxAmount, dateFrom, dateTo, viewMode],
    queryFn: () => getTransactions({
      type: filter.type !== 'all' ? filter.type : undefined,
      category: filter.category || undefined,
      startDate: effectiveStartDate || undefined,
      endDate: effectiveEndDate || undefined,
      search: search || undefined,
      keyword: search || undefined,
      min_amount: minAmount ? Number(minAmount) : undefined,
      max_amount: maxAmount ? Number(maxAmount) : undefined,
      page,
      pageSize: PAGE_SIZE,
      ...(sortOrder ? { sortBy: 'amount' as const, sortOrder } : {}),
      // Owner 视角：如果 viewMode=all 且是 Owner，则查看所有成员的交易
      ...(viewMode === 'all' && isOwner && currentBook ? { view: 'all' as const, bookId: currentBook.id } : {}),
    }),
  })

  const transactions = paginated?.data || []
  const total = paginated?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const pageExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const pageIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      notify({ type: 'success', message: '删除成功' })
      setDeleteTarget(null)
    },
  })

  const handleFilterChange = (newFilter: { type: string; category: string }) => {
    setFilter({
      type: newFilter.type as 'all' | 'income' | 'expense',
      category: newFilter.category,
      startDate: filter.startDate,
      endDate: filter.endDate,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleEdit = (id: number) => {
    navigate(`/add?edit=${id}`)
  }

  const handleDelete = (id: number) => {
    setDeleteTarget({ id })
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }

  // ---- Build activeChips from non-empty filter values ----
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = []

    if (search) {
      chips.push({
        label: `搜索: ${search}`,
        onRemove: () => setSearch(''),
      })
    }

    if (minAmount) {
      chips.push({
        label: `最低金额 ≥ ¥${minAmount}`,
        onRemove: () => setMinAmount(''),
      })
    }

    if (maxAmount) {
      chips.push({
        label: `最高金额 ≤ ¥${maxAmount}`,
        onRemove: () => setMaxAmount(''),
      })
    }

    if (dateFrom) {
      chips.push({
        label: `日期从 ${dateFrom}`,
        onRemove: () => setDateFrom(''),
      })
    }

    if (dateTo) {
      chips.push({
        label: `日期至 ${dateTo}`,
        onRemove: () => setDateTo(''),
      })
    }

    return chips
  }, [search, minAmount, maxAmount, dateFrom, dateTo])

  // ---- FilterPanel toggle handler ----
  const handleFilterPanelToggle = useCallback(() => {
    setFilterPanelExpanded(prev => !prev)
  }, [])

  return (
    <div className="page-container">
      <Header title="交易记录">
        <Button onClick={() => navigate(buildAddUrl(filter.type, filter.category))}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          记一笔
        </Button>
      </Header>

      {/* Owner 视图切换 */}
      {isOwner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>查看范围：</span>
          <button
            onClick={() => setViewMode('own')}
            style={{
              padding: '4px 12px',
              fontSize: '13px',
              border: `1px solid ${viewMode === 'own' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              background: viewMode === 'own' ? 'var(--accent)' : 'var(--surface)',
              color: viewMode === 'own' ? '#fff' : 'var(--fg)',
              cursor: 'pointer',
            }}
          >
            仅我看
          </button>
          <button
            onClick={() => setViewMode('all')}
            style={{
              padding: '4px 12px',
              fontSize: '13px',
              border: `1px solid ${viewMode === 'all' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              background: viewMode === 'all' ? 'var(--accent)' : 'var(--surface)',
              color: viewMode === 'all' ? '#fff' : 'var(--fg)',
              cursor: 'pointer',
            }}
          >
            全部成员
          </button>
        </div>
      )}

      <FilterBar
        selectedType={filter.type}
        selectedCategory={filter.category}
        onFilterChange={handleFilterChange}
        search={search}
        onSearchChange={handleSearchChange}
        activeChips={activeChips}
        filterPanel={
          <FilterPanel
            expanded={filterPanelExpanded}
            minAmount={minAmount}
            maxAmount={maxAmount}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onMinAmountChange={setMinAmount}
            onMaxAmountChange={setMaxAmount}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onToggle={handleFilterPanelToggle}
          />
        }
      />

      {/* 排序 + 总数 + 本页总金额 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          共 {total} 条交易
          {pageExpense > 0 && (
            <span style={{ marginLeft: '12px', fontWeight: 600, color: 'var(--danger)' }}>
              本页支出 {formatAmount(pageExpense)}
            </span>
          )}
          {pageIncome > 0 && (
            <span style={{ marginLeft: '8px', fontWeight: 600, color: 'var(--success)' }}>
              本页收入 {formatAmount(pageIncome)}
            </span>
          )}
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === undefined ? 'asc' : sortOrder === 'asc' ? 'desc' : undefined)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
            fontSize: '13px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer',
          }}
        >
          {sortOrder === undefined ? (
            <>金额 ▾</>
          ) : sortOrder === 'desc' ? (
            <>金额 <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline' }}><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg></>
          ) : (
            <>金额 <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline' }}><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/></svg></>
          )}
        </button>
      </div>

      {isLoading ? (
        <TransactionListSkeleton count={PAGE_SIZE} />
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {search ? (
            <p>未找到包含「{search}」的交易</p>
          ) : (
            <>
              <p>暂无交易记录</p>
              <Button onClick={() => navigate(buildAddUrl(filter.type, filter.category))} style={{ marginTop: '16px' }}>
                添加第一笔交易
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <TransactionsList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />

          {/* 分页器 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 12px', fontSize: '13px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: page <= 1 ? 'var(--muted)' : 'var(--fg)',
                cursor: page <= 1 ? 'default' : 'pointer',
              }}
            >
              上一页
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    minWidth: '32px', padding: '6px 8px', fontSize: '13px', textAlign: 'center',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    background: pageNum === page ? 'var(--accent)' : 'var(--surface)',
                    color: pageNum === page ? '#fff' : 'var(--fg)',
                    cursor: 'pointer', fontWeight: pageNum === page ? 600 : 400,
                  }}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '6px 12px', fontSize: '13px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', background: 'var(--surface)', color: page >= totalPages ? 'var(--muted)' : 'var(--fg)',
                cursor: page >= totalPages ? 'default' : 'pointer',
              }}
            >
              下一页
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除"
        message="确定要删除这笔交易吗？删除后不可恢复。"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />

      {/* 批量操作栏 */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        loading={batchMutation.isPending}
        onUpdateCategory={() => handleBatchAction('update_category')}
        onUpdateType={() => handleBatchAction('update_type')}
        onUpdateDate={() => handleBatchAction('update_date')}
        onMoveBook={() => handleBatchAction('move_book')}
        onDelete={() => handleBatchAction('delete')}
      />

      {/* 批量操作弹窗 */}
      {batchDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setBatchDialog(null)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: 24, minWidth: 320, maxWidth: 420,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {batchDialog === 'delete' ? '确认删除' : 
               batchDialog === 'category' ? '选择分类' :
               batchDialog === 'type' ? '选择类型' :
               batchDialog === 'date' ? '选择日期' : '选择账本'}
              （{selectedIds.size} 条）
            </h3>

            {batchDialog === 'category' && (
              <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
                {categories.map(c => (
                  <div key={c.id}
                    onClick={() => setBatchCategory(c.id)}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', borderRadius: 6,
                      background: batchCategory === c.id ? 'var(--accent)' : undefined,
                      color: batchCategory === c.id ? '#fff' : 'var(--fg)',
                    }}
                  >{c.icon} {c.name}</div>
                ))}
              </div>
            )}

            {batchDialog === 'type' && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                {(['income', 'expense'] as const).map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="radio" name="batchType" value={t} checked={batchType === t}
                      onChange={() => setBatchType(t)} />
                    <span>{t === 'income' ? '💰 收入' : '💸 支出'}</span>
                  </label>
                ))}
              </div>
            )}

            {batchDialog === 'date' && (
              <div style={{ marginBottom: 16 }}>
                <input type="date" value={batchDate}
                  onChange={e => setBatchDate(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }}
                />
              </div>
            )}

            {batchDialog === 'book' && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>
                  输入目标账本 ID（或从账本列表复制）
                </p>
                <input type="text" value={batchBookId}
                  onChange={e => setBatchBookId(e.target.value)}
                  placeholder="账本 UUID"
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }}
                />
              </div>
            )}

            {batchDialog === 'delete' && (
              <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 16 }}>
                确定删除选中的 {selectedIds.size} 条交易？此操作不可撤销。
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setBatchDialog(null)}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer',
                }}>取消</button>
              <button onClick={handleBatchConfirm}
                disabled={batchMutation.isPending}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: batchDialog === 'delete' ? 'var(--danger)' : 'var(--accent)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600,
                }}>
                {batchMutation.isPending ? '执行中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
