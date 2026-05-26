import React from 'react'
import './index.scss'

interface Transaction {
  id: number
  name: string
  icon: string
  meta: string
  amount: string
  isIncome: boolean
}

interface TransactionsListProps {
  transactions: Transaction[]
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  const showActions = Boolean(onEdit) || Boolean(onDelete)

  return (
    <div className="transactions-list">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="transaction-item">
          <div className="transaction-icon">{transaction.icon}</div>
          <div className="transaction-info">
            <div className="transaction-name">{transaction.name}</div>
            <div className="transaction-meta">{transaction.meta}</div>
          </div>
          <div className={`transaction-amount ${transaction.isIncome ? 'income' : 'expense'}`}>
            {transaction.amount}
          </div>

          {showActions && (
            <div className="transaction-actions">
              {onEdit && (
                <button
                  type="button"
                  className="action-btn action-btn--edit"
                  title="编辑"
                  onClick={() => onEdit(transaction.id)}
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
                  onClick={() => onDelete(transaction.id)}
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
      ))}
    </div>
  )
}
