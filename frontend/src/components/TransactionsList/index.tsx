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
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ transactions }) => {
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
        </div>
      ))}
    </div>
  )
}