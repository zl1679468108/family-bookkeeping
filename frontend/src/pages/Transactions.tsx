import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { Button } from '../components/ui/button'
import { FilterBar } from '../components/FilterBar'
import { TransactionsList } from '../components/TransactionsList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { getTransactions, deleteTransaction } from '../services/api'
import { formatAmount } from '../utils/common'
import { notify } from '../utils/notifications'

const buildAddUrl = (type: string, category: string): string => {
  const params = new URLSearchParams()
  if (type && type !== 'all') params.append('type', type)
  if (category) params.append('category', category)
  return `/add${params.toString() ? '?' + params.toString() : ''}`
}

interface DeleteTarget {
  id: number
}

const PAGE_SIZE = 10

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  // 从 URL searchParams 初始化筛选条件（支持饼图下钻跳转）
  const [filter, setFilter] = useState(() => {
    const category = searchParams.get('category') || ''
    const type = (searchParams.get('type') as 'all' | 'income' | 'expense') || 'all'
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    return { type, category, startDate, endDate }
  })

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // 筛选条件变化时重置页码
  useEffect(() => {
    setPage(1)
  }, [filter, search])

  const { data: paginated, isLoading } = useQuery({
    queryKey: ['transactions', filter.type, filter.category, filter.startDate, filter.endDate, search, page, sortOrder],
    queryFn: () => getTransactions({
      type: filter.type !== 'all' ? filter.type : undefined,
      category: filter.category || undefined,
      startDate: filter.startDate || undefined,
      endDate: filter.endDate || undefined,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
      ...(sortOrder ? { sortBy: 'amount' as const, sortOrder } : {}),
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

  return (
    <div>
      <Header title="交易记录">
        <Button onClick={() => navigate(buildAddUrl(filter.type, filter.category))}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          记一笔
        </Button>
      </Header>

      <FilterBar
        selectedType={filter.type}
        selectedCategory={filter.category}
        onFilterChange={handleFilterChange}
        search={search}
        onSearchChange={handleSearchChange}
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
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
    </div>
  )
}

export default Transactions
