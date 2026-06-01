import React from 'react'
import { useCategoryLookup } from '../../hooks/useCategories'
import { formatAmountWithType, formatDate } from '../../utils/common'
import type { Transaction } from '../../services/api'
import './index.scss'

interface TransactionsListProps {
  transactions: Transaction[]
  dateMode?: 'full' | 'dashboard'
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  /** 批量操作模式 */
  selectable?: boolean
  selectedIds?: Set<number>
  onToggleSelect?: (id: number) => void
  onToggleSelectAll?: (pageIds: number[]) => void
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  dateMode = 'full',
  onEdit,
  onDelete,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()
  const showActions = Boolean(onEdit) || Boolean(onDelete)
  const pageIds = transactions.map(t => t.id)
  const allSelected = selectable && pageIds.length > 0 && pageIds.every(id => selectedIds?.has(id))

  return (
    <div className="transactions-list">
      {/* 全选表头 */}
      {selectable && pageIds.length > 0 && (
        <div className="transaction-item" style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onToggleSelectAll?.(pageIds)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>全选 {pageIds.length} 条</div>
          <div />
          {showActions && <div />}
        </div>
      )}
      {transactions.map((item) => {
        const isIncome = item.type === 'income'
        const categoryName = getCategoryName(item.category)
        const icon = getCategoryIcon(item.category)
        const isSelected = selectable && selectedIds?.has(item.id)

        const name = item.description || categoryName
        const metaParts = [formatDate(item.date, dateMode), categoryName]
        if (item.location_name) {
          metaParts.push(item.location_name)
        }
        const meta = metaParts.join(' · ')
        const amount = formatAmountWithType(parseFloat(String(item.amount)), isIncome)

        return (
          <div
            key={item.id}
            className="transaction-item"
            style={isSelected ? { background: 'rgba(var(--accent-rgb, 59,130,246), 0.06)' } : undefined}
          >
            {selectable && (
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect?.(item.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
              </div>
            )}
            <div className="transaction-icon">{icon}</div>
            <div className="transaction-info">
              <div className="transaction-name">{name}</div>
              <div className="transaction-meta">{meta}</div>
            </div>
            <div className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
              {amount}
            </div>

            {showActions && (
              <div className="transaction-actions">
                {onEdit && (
                  <button
                    type="button"
                    className="action-btn action-btn--edit"
                    title="编辑"
                    onClick={() => onEdit(item.id)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="action-btn action-btn--delete"
                    title="删除"
                    onClick={() => onDelete(item.id)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
