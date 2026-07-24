import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getTransactions, deleteTransaction } from '../../services/api'
import { useCategoryLookup, useCategories } from '../../hooks/useCategories'
import { useBook } from '../../hooks/useBook'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import type { DropdownOption } from '../../components/ui/Dropdown'
import type { Transaction } from '../../services/api'
import type { Category } from '@family-bookkeeping/shared-types';
import { useDebounce } from '../../hooks/useDebounce'
import { DEBOUNCE_SEARCH_MS } from '../../utils/timing'
import { useMutationAction } from '../../hooks/useMutationAction'
import { useFocusItem } from '../../hooks/useFocusItem'
import { formatAmount, formatAmountByType } from '../../utils/common'
import { formatDateYMD } from '../../utils/date'
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
import { parseImageList } from '../../utils/parseImageList'
import { queryKeys, TRANSACTION_IMPACT_ROOT_KEYS } from '../../utils/queryKeys'
import { STALE } from '../../utils/cachePolicy'
import { transactionTypeLabel, TRANSACTION_TYPE_OPTIONS, FILTER_ALL_TYPES, FILTER_ALL_CATEGORIES, FILTER_ALL_TIME, FILTER_LAST_7_DAYS, FILTER_LAST_30_DAYS } from '../../utils/transactionType'
import {
  transactionTimeDateRange,
  sumTransactionsByType,
} from '../../utils/transactionList'
import { successEntityDeleted } from '../../utils/successCopy'
import { ENTITY_TRANSACTION, DETAIL_TRANSACTION } from '../../utils/entityCopy'
import { ERROR_DELETE_FAILED, ERROR_NO_TRANSACTION_SELECTED_DELETE } from '../../utils/errorCopy'
import { EMPTY_TRANSACTIONS } from '../../utils/emptyCopy'
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  CONFIRM_DELETE_TRANSACTION,
} from '../../utils/confirmCopy'
import { FORM_SEARCH_TXN, FORM_MIN_AMOUNT, FORM_MAX_AMOUNT } from '../../utils/formCopy'
import { FIELD_BRAND, FIELD_DESCRIPTION, FIELD_PLACE, FIELD_COORDINATES, FIELD_CREATED_AT, FIELD_ATTACHMENT, fieldAttachmentCount } from '../../utils/fieldCopy'
import { attachmentImageAlt } from '../../utils/uploadCopy'

const PAGE_SIZE = 20

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''
  const { getCategoryName, getCategoryIconNode } = useCategoryLookup()

  // 高亮聚焦项
  useFocusItem()

  const today = new Date()
  const todayStr = formatDateYMD(today)

  const { data: allCategories = [] } = useCategories()

  // 筛选状态：从 URL 初始化，变更后写回 URL（刷新/返回不丢）
  const [typeFilter, setTypeFilter] = useState<string>(() => searchParams.get('type') || '')
  const [dateFilter, setDateFilter] = useState<string>(() => searchParams.get('date') || '')
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get('category') || '')
  const [search, setSearch] = useState(() => searchParams.get('q') || '')
  const [minAmount, setMinAmount] = useState(() => searchParams.get('min') || '')
  const [maxAmount, setMaxAmount] = useState(() => searchParams.get('max') || '')
  const [page, setPage] = useState(() => {
    const n = Number(searchParams.get('page') || '1')
    return Number.isFinite(n) && n > 0 ? n : 1
  })
  const [pageSize, setPageSize] = useState(() => {
    const n = Number(searchParams.get('pageSize') || String(PAGE_SIZE))
    return Number.isFinite(n) && n > 0 ? n : PAGE_SIZE
  })
  const debouncedSearch = useDebounce(search, DEBOUNCE_SEARCH_MS)

  useEffect(() => {
    const next = new URLSearchParams()
    if (typeFilter) next.set('type', typeFilter)
    if (dateFilter) next.set('date', dateFilter)
    if (categoryFilter) next.set('category', categoryFilter)
    if (debouncedSearch) next.set('q', debouncedSearch)
    if (minAmount) next.set('min', minAmount)
    if (maxAmount) next.set('max', maxAmount)
    if (page > 1) next.set('page', String(page))
    if (pageSize !== PAGE_SIZE) next.set('pageSize', String(pageSize))
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [
    typeFilter,
    dateFilter,
    categoryFilter,
    debouncedSearch,
    minAmount,
    maxAmount,
    page,
    pageSize,
    searchParams,
    setSearchParams,
  ])

  const categoryOptions: DropdownOption[] = useMemo(() => {
    return allCategories
      .filter((c: Category) => !typeFilter || c.type === typeFilter)
      .map((c: Category) => ({
        key: c.id,
        label: c.name,
        icon: renderCategoryIcon(c.icon, { size: 16 }),
      }))
  }, [typeFilter, allCategories])

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

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
  }, [])

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { run: handleDelete, isRunning: deleteLoading } = useMutationAction(
    async () => {
      if (!selectedTransaction) {
        throw new Error(ERROR_NO_TRANSACTION_SELECTED_DELETE)
      }
      await deleteTransaction(selectedTransaction.id)
    },
    {
      invalidateKeys: TRANSACTION_IMPACT_ROOT_KEYS,
      successMessage: successEntityDeleted(ENTITY_TRANSACTION),
      errorMessage: ERROR_DELETE_FAILED,
      onSuccess: () => {
        setShowDetail(false)
        setShowDeleteConfirm(false)
        setSelectedTransaction(null)
      },
    },
  )

  const timeRange = useMemo(
    () => transactionTimeDateRange(dateFilter),
    [dateFilter],
  )
  const effectiveStartDate = timeRange.startDate || ''
  const effectiveEndDate = timeRange.endDate || todayStr

  const listFilters = useMemo(() => ({
    type: typeFilter || '',
    category: categoryFilter || '',
    startDate: effectiveStartDate || '',
    endDate: effectiveEndDate || '',
    search: debouncedSearch || '',
    minAmount: minAmount || '',
    maxAmount: maxAmount || '',
    page,
    pageSize,
  }), [typeFilter, categoryFilter, effectiveStartDate, effectiveEndDate, debouncedSearch, minAmount, maxAmount, page, pageSize])

  const { data: paginated, isLoading } = useQuery({
    queryKey: queryKeys.transactions.list(bookId, listFilters),
    queryFn: () => getTransactions({
      type: (typeFilter || undefined) as 'income' | 'expense' | undefined,
      category: categoryFilter || undefined,
      startDate: effectiveStartDate || undefined,
      endDate: effectiveEndDate || undefined,
      search: debouncedSearch || undefined,
      min_amount: minAmount ? Number(minAmount) : undefined,
      max_amount: maxAmount ? Number(maxAmount) : undefined,
      page,
      pageSize,
    }),
    enabled: !!bookId,
    staleTime: STALE.transactions,
    placeholderData: keepPreviousData,
  })

  const transactions = paginated?.data || []
  const total = paginated?.total || 0
  const { expense: totalExpense, income: totalIncome } = sumTransactionsByType(transactions)

  const typeOptions = useMemo(() => [...TRANSACTION_TYPE_OPTIONS], [])

  const dateOptions = useMemo(() => [
    { key: 'week', label: FILTER_LAST_7_DAYS },
    { key: 'month', label: FILTER_LAST_30_DAYS },
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
                placeholder={FORM_SEARCH_TXN}
              />

              <DropdownSelect
                options={typeOptions}
                value={typeFilter}
                placeholder={FILTER_ALL_TYPES}
                onChange={handleTypeChange}
              />

              <DropdownSelect
                options={categoryOptions}
                value={categoryFilter}
                placeholder={FILTER_ALL_CATEGORIES}
                onChange={handleCategoryChange}
              />

              <DropdownSelect
                options={dateOptions}
                value={dateFilter}
                placeholder={FILTER_ALL_TIME}
                onChange={handleDateChange}
              />

              <span className="filter-amount-range">
                <NumberInput
                  value={minAmount}
                  onChange={(v) => { setMinAmount(v); handleAmountFilterChange() }}
                  placeholder={FORM_MIN_AMOUNT}
                  prefix="¥"
                  wrapperClassName="filter-amount-input"
                />
                <span className="filter-amount-sep">-</span>
                <NumberInput
                  value={maxAmount}
                  onChange={(v) => { setMaxAmount(v); handleAmountFilterChange() }}
                  placeholder={FORM_MAX_AMOUNT}
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
            description={EMPTY_TRANSACTIONS}
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
                      aria-label={`查看交易详情：${t.description || getCategoryName(t.category)} ${formatAmountByType(t.amount, t.type)}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{formatDateYMD(t.date)}</td>
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
                        {formatAmountByType(t.amount, t.type)}
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
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      )}

      {selectedTransaction && (
        <GlobalModal
          type="detail"
          open={showDetail}
          onClose={() => setShowDetail(false)}
          title={DETAIL_TRANSACTION}
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
                {transactionTypeLabel(selectedTransaction.type)} · {formatDateYMD(selectedTransaction.date)}
              </div>
              <div className="detail-amount">
                <div className={`detail-amount-value ${selectedTransaction.type === 'income' ? 'income' : ''}`}>
                  {formatAmountByType(selectedTransaction.amount, selectedTransaction.type)}
                </div>
              </div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            {selectedTransaction.brand && <DetailItem label={FIELD_BRAND} value={selectedTransaction.brand} />}
            {selectedTransaction.description && (
              <DetailItem
                label={FIELD_DESCRIPTION}
                value={<span style={{ whiteSpace: 'pre-wrap' }}>{selectedTransaction.description}</span>}
                className="full-width"
              />
            )}
            {selectedTransaction.location_name && <DetailItem label={FIELD_PLACE} value={selectedTransaction.location_name} />}
            {selectedTransaction.latitude && selectedTransaction.longitude && (
              <DetailItem label={FIELD_COORDINATES} value={`${selectedTransaction.latitude}, ${selectedTransaction.longitude}`} />
            )}
            {selectedTransaction.created_at && (
              <DetailItem label={FIELD_CREATED_AT} value={selectedTransaction.created_at} />
            )}
          </div>

          {(() => {
            const imgs = parseImageList(selectedTransaction)
            if (imgs.length === 0) return null
            return (
              <>
                <div className="detail-divider" />
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-item-label">{fieldAttachmentCount(imgs.length)}</span>
                  <div className="detail-image-grid">
                    {imgs.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-image-item"
                      >
                        <img src={url} alt={attachmentImageAlt(idx + 1)} />
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
        title={CONFIRM_DELETE_TITLE}
        onConfirm={handleDelete}
        onClose={() => {
          setShowDeleteConfirm(false)
        }}
        loading={deleteLoading}
        confirmText={CONFIRM_DELETE_TEXT}
        confirmDanger
      >
        {CONFIRM_DELETE_TRANSACTION}
      </GlobalModal>
    </div>
  )
}

export default Transactions
