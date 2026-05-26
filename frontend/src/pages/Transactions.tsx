import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { Button } from '../components/ui/button'
import { FilterBar } from '../components/FilterBar'
import { TransactionsList } from '../components/TransactionsList'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { expenseCategoryDict, incomeCategoryDict } from '../utils/commonDic'
import { formatAmountWithType, formatDate } from '../utils/common'
import { getTransactions, deleteTransaction } from '../services/api'
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

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState({ type: 'all' as 'all' | 'income' | 'expense', category: '' })
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions()
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      notify({ type: 'success', message: '删除成功' })
      setDeleteTarget(null)
    },
    onError: (error: Error) => {
      notify({ type: 'error', message: `删除失败: ${error.message}` })
    }
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

      <FilterBar selectedType={filter.type} selectedCategory={filter.category} onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>暂无交易记录</p>
          <Button onClick={() => navigate(buildAddUrl(filter.type, filter.category))} style={{ marginTop: '16px' }}>
            添加第一笔交易
          </Button>
        </div>
      ) : (
        <TransactionsList
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
