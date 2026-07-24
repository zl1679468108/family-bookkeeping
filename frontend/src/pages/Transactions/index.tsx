import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { startOfMonth, format, parse } from 'date-fns'
import { getTransactions, deleteTransaction } from '../../services/api'
import { useCategoryLookup, useCategories } from '../../hooks/useCategories'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import type { DropdownOption } from '../../components/ui/Dropdown'
import type { Transaction } from '../../services/api'
import type { Category } from '@family-bookkeeping/shared-types';
import { useDebounce } from '../../hooks/useDebounce'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useFocusItem } from '../../hooks/useFocusItem'
import { formatAmount, formatAmountWithType } from '../../utils/common'
import { Skeleton } from '../../components/ui/Skeleton'
import { GlobalModal, DetailItem, Space } from '../../components/ui'
import { Card } from '../../components/ui/Card'
import { DropdownSelect } from '../../components/ui/Dropdown'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { EmptyAddTransactionAction } from '../../components/ui/EmptyState/emptyActions'
import { FilterBar } from '../../components/ui/FilterBar'
import { SearchInput, NumberInput } from '../../components/ui/Input'

import { useQueryClient } from '@tanstack/react-query'
import { parseImageList } from '../../utils/parseImageList'
import { notifySuccess } from '../../utils/notifyError'

const PAGE_SIZE = 20

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { getCategoryName, getCategoryIconNode } = useCategoryLookup()

  // 高亮聚焦项
  useFocusItem()

  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const todayStr = format(today, 'yyyy-MM-dd')

  const { data: allCategories = [] } = useCategories()

  const [typeFilter, setTypeFilter] = useState<string>(() => {
    const t = searchParams.get('type')
    return t || ''
  })
  const [dateFilter, setDateFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const debouncedSearch = useDebounce(search, 800)

  const categoryOptions: DropdownOption[] = useMemo(() => {
    return allCategories
      .filter((c: Category) => !typeFilter || c.type === typeFilter)
      .map((c: Category) => ({
        key: c.id,
        label: c.name,
        icon: renderCategoryIcon(c.icon, { size: 16 }),
      }))
  }, [typeFilter, allCategories])

  // 过滤器变化时重置页码到第 1 页（F-M6）
  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType)
    setPage(1)
    if (categoryFilter && newType) {
      const matched = allCategories.find((c: Category) => c.id === categoryFilter)
      if (matched && matched.type !== newType) {
        setCategoryFilter('')
      }
    }
  }

  const handleCategoryChange = (key: string) => {
    setCategoryFilter(key)
    setPage(1)
  }

  const handleDateChange = (key: string) => {
    setDateFilter(key)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleAmountFilterChange = () => {
    setPage(1)
  }

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { run: handleDelete, isRunning: deleteLoading } = useDebouncedAction(async () => {
    if (!selectedTransaction) return
    await deleteTransaction(selectedTransaction.id)
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['statistics'] })
    setShowDetail(false)
    setShowDeleteConfirm(false)
    notifySuccess('交易已删除')
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
    queryKey: ['transactions', typeFilter, categoryFilter, effectiveStartDate, todayStr, debouncedSearch, minAmount, maxAmount, page, pageSize],
    queryFn: () => getTransactions({
      type: (typeFilter || undefined) as 'income' | 'expense' | undefined,
      category: categoryFilter || undefined,
      startDate: effectiveStartDate || undefined,
      endDate: todayStr,
      search: debouncedSearch || undefined,
      min_amount: minAmount ? Number(minAmount) : undefined,
      max_amount: maxAmount ? Number(maxAmount) : undefined,
      page,
      pageSize,
    }),
  })

  const transactions = paginated?.data || []
  const total = paginated?.total || 0
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const typeOptions = useMemo(() => [
    { key: 'income', label: '收入' },
    { key: 'expense', label: '支出' },
  ], []);

  const dateOptions = useMemo(() => [
    { key: 'week', label: '近 7 天' },
    { key: 'month', label: '近 30 天' },
  ], []);

  return (
    <div className="page-container">
      <div className="filter-sticky">
        <FilterBar
          left={
            <>
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="搜索描述/品牌..."
              />

              <DropdownSelect
                options={typeOptions}
                value={typeFilter}
                placeholder="全部类型"
                onChange={handleTypeChange}
              />

              <DropdownSelect
                options={categoryOptions}
                value={categoryFilter}
                placeholder="全部分类"
                onChange={handleCategoryChange}
              />

              <DropdownSelect
                options={dateOptions}
                value={dateFilter}
                placeholder="全部时间"
                onChange={handleDateChange}
              />

              <span className="filter-amount-range">
                <NumberInput
                  value={minAmount}
                  onChange={(v) => { setMinAmount(v); handleAmountFilterChange() }}
                  placeholder="最小金额"
                  prefix="¥"
                  wrapperClassName="filter-amount-input"
                />
                <span className="filter-amount-sep">-</span>
                <NumberInput
                  value={maxAmount}
                  onChange={(v) => { setMaxAmount(v); handleAmountFilterChange() }}
                  placeholder="最大金额"
                  prefix="¥"
                  wrapperClassName="filter-amount-input"
                />
              </span>
            </>
          }
          right={
            <span className="filter-summary">
              本页{transactions.length}笔 · 支出{formatAmount(totalExpense)} · 收入{formatAmount(totalIncome)}
            </span>
          }
        />
      </div>

      {isLoading ? (
        <>
          <Card>
            <table className="data-table txn-table">
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
                    <td><Skeleton width="70%" height="13px" /></td>
                    <td><Skeleton width="60%" height="13px" /></td>
                    <td><Skeleton width="35%" height="13px" /></td>
                    <td><Skeleton width="60%" height="13px" /></td>
                    <td style={{ textAlign: 'right' }}><Skeleton width="55%" height="14px" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
            <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
            <Skeleton width="120px" height="12px" />
            <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
          </div>
        </>
      ) : transactions.length === 0 ? (
        <Card>
          <EmptyState
            title="暂无交易记录"
            action={
              <EmptyAddTransactionAction onClick={() => navigate('/add?type=expense')} />
            }
          />
        </Card>
      ) : (
        <div className="data-table-panel data-table-panel--txn">
          <div className="data-table-panel__scroll">
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
                  return (
                    <tr
                      key={t.id}
                      data-focus={t.id}
                      onClick={() => { setSelectedTransaction(t); setShowDetail(true) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedTransaction(t)
                          setShowDetail(true)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`查看交易详情：${t.description || getCategoryName(t.category)} ${formatAmountWithType(t.amount, t.type === 'income')}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{format(parse(t.date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd')}</td>
                      <td><span className="cell-cat">{getCategoryIconNode(t.category, 16)} {getCategoryName(t.category)}</span></td>
                      <td>
                        {t.brand ? (
                          <span className="brand-tag">{t.brand}</span>
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

          <div className="data-table-panel__footer">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {selectedTransaction && (
        <GlobalModal
          type="detail"
          open={showDetail}
          onClose={() => setShowDetail(false)}
          title="交易详情"
          footer={
            <Space size="sm">
              <Button variant="secondary" onClick={() => { navigate(`/add?edit=${selectedTransaction.id}`); setShowDetail(false) }}>
                编辑
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除
              </Button>
            </Space>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{getCategoryIconNode(selectedTransaction.category, 40)}</div>
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
            {selectedTransaction.brand && <DetailItem label="品牌" value={selectedTransaction.brand} />}
            {selectedTransaction.description && (
              <DetailItem
                label="描述"
                value={<span style={{ whiteSpace: 'pre-wrap' }}>{selectedTransaction.description}</span>}
                className="full-width"
              />
            )}
            {selectedTransaction.location_name && <DetailItem label="地点" value={selectedTransaction.location_name} />}
            {selectedTransaction.latitude && selectedTransaction.longitude && (
              <DetailItem label="坐标" value={`${selectedTransaction.latitude}, ${selectedTransaction.longitude}`} />
            )}
            {selectedTransaction.created_at && (
              <DetailItem label="创建时间" value={selectedTransaction.created_at} />
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
        </GlobalModal>
      )}

      <GlobalModal
        type="confirm"
        open={showDeleteConfirm}
        title="确认删除"
        onConfirm={handleDelete}
        onClose={() => {
          setShowDeleteConfirm(false)
        }}
        loading={deleteLoading}
        confirmText="确认删除"
        confirmDanger
      >
        确定要删除这笔交易吗？
      </GlobalModal>
    </div>
  )
}

export default Transactions
