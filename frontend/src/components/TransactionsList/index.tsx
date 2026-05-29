import React from 'react'
import { useCategoryLookup } from '../../hooks/useCategories'
import { formatAmountWithType, formatDate } from '../../utils/common'
import type { Transaction } from '../../services/api'
import './index.scss'

interface TransactionsListProps {
  transactions: Transaction[]
  dateMode?: 'full' | 'dashboard'  // dashboard: 今天/昨天特殊显示；full: 始终 M月D日 HH:MM
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  dateMode = 'full',
  onEdit,
  onDelete,
}) => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup()
  const showActions = Boolean(onEdit) || Boolean(onDelete)

  return (
    <div className="transactions-list">
      {transactions.map((item) => {
        const isIncome = item.type === 'income'
        const categoryName = getCategoryName(item.category)
        const icon = getCategoryIcon(item.category)

        const name = item.description || categoryName
        const metaParts = [formatDate(item.date, dateMode), categoryName]
        if (item.location_name) {
          metaParts.push(item.location_name)
        }
        const meta = metaParts.join(' · ')
        const amount = formatAmountWithType(parseFloat(String(item.amount)), isIncome)

        return (
          <div key={item.id} className="transaction-item">
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
