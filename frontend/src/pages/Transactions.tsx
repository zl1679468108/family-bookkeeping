import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { FilterBar } from '../components/FilterBar'
import { TransactionsList } from '../components/TransactionsList'
import { expenseCategoryDict, incomeCategoryDict } from '../utils/commonDic'
import { formatAmountWithType, formatDate } from '../utils/common'
import { getTransactions } from '../services/api'

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState({ type: 'all' as 'all' | 'income' | 'expense', category: '' })

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions()
  })

  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])

  useEffect(() => {
    let filtered = transactions

    if (filter.type !== 'all') {
      filtered = transactions.filter((t: any) => t.type === filter.type)
    }

    if (filter.category) {
      filtered = filtered.filter((t: any) => t.category === filter.category)
    }

    const mapped = filtered.map((item: any) => {
      const isIncome = item.type === 'income'
      const categoryInfo: { name: string; icon: string } = (isIncome ? incomeCategoryDict[item.category as keyof typeof incomeCategoryDict] : expenseCategoryDict[item.category as keyof typeof expenseCategoryDict]) || { name: item.category || '其他', icon: '📌' }
      
      return {
        id: item.id,
        name: item.description || categoryInfo.name,
        icon: categoryInfo.icon,
        meta: `${formatDate(item.date)} · ${categoryInfo.name}`,
        amount: formatAmountWithType(parseFloat(item.amount), isIncome),
        isIncome
      }
    })

    setFilteredTransactions(mapped)
  }, [transactions, filter])

  const handleFilterChange = (newFilter: { type: string; category: string }) => {
    setFilter({
      type: newFilter.type as 'all' | 'income' | 'expense',
      category: newFilter.category
    })
  }

  return (
    <div>
      <Header title="交易记录">
        <Button onClick={() => navigate('/add')}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          记一笔
        </Button>
      </Header>

      <FilterBar selectedType={filter.type} selectedCategory={filter.category} onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>暂无交易记录</p>
          <Button onClick={() => navigate('/add')} style={{ marginTop: '16px' }}>
            添加第一笔交易
          </Button>
        </div>
      ) : (
        <TransactionsList transactions={filteredTransactions} />
      )}
    </div>
  )
}

export default Transactions