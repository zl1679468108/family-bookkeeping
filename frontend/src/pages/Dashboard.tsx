import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { Button } from '../components/Button'
import { StatCard } from '../components/StatCard'
import { TransactionsList } from '../components/TransactionsList'
import { expenseCategoryDict, incomeCategoryDict } from '../utils/commonDic'
import { formatAmount, formatAmountWithType, formatDate } from '../utils/common'
import { getTransactions } from '../services/api'

interface TransactionData {
  id: number
  name: string
  category: string
  date: string
  amount: number
  type: 'income' | 'expense'
  description?: string
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions()
  })

  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [monthlyExpense, setMonthlyExpense] = useState(0)

  useEffect(() => {
    if (transactions.length > 0) {
      const mapped = transactions.slice(0, 5).map((item: any) => {
        const isIncome = item.type === 'income'
        const categoryInfo: { name: string; icon: string } = (isIncome ? incomeCategoryDict[item.category as keyof typeof incomeCategoryDict] : expenseCategoryDict[item.category as keyof typeof expenseCategoryDict]) || { name: item.category || '其他', icon: '📌' }
        return {
          id: item.id,
          name: item.description || categoryInfo.name,
          icon: categoryInfo.icon,
          meta: `${formatDate(item.date, 'dashboard')} · ${categoryInfo.name}`,
          amount: formatAmountWithType(parseFloat(item.amount), isIncome),
          isIncome
        }
      })
      setRecentTransactions(mapped)

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      let totalIncome = 0
      let totalExpense = 0
      let currentBalance = 0

      transactions.forEach((t: any) => {
        const amount = parseFloat(t.amount)
        if (t.type === 'income') {
          totalIncome += amount
          currentBalance += amount
        } else {
          totalExpense += amount
          currentBalance -= amount
        }
      })

      setBalance(currentBalance)
      setMonthlyIncome(totalIncome)
      setMonthlyExpense(totalExpense)
    }
  }, [transactions])

  return (
    <div>
      <Header title="概览">
        <Button variant="secondary" onClick={() => navigate('/reports')}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
          </svg>
          查看报表
        </Button>
        <Button onClick={() => navigate('/add')}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          记一笔
        </Button>
      </Header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>加载中...</div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>暂无交易记录</p>
          <Button onClick={() => navigate('/add')} style={{ marginTop: '16px' }}>
            添加第一笔交易
          </Button>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            <StatCard 
              label="账户余额" 
              value={formatAmount(balance)} 
              trend={{ value: balance >= 0 ? '财务健康' : '支出较大', positive: balance >= 0 }}
              isBalance
            />
            <StatCard 
              label="总收入" 
              value={formatAmount(monthlyIncome)} 
              trend={{ value: `+${transactions.filter((t: any) => t.type === 'income').length} 笔`, positive: true }}
            />
            <StatCard 
              label="总支出" 
              value={formatAmount(monthlyExpense)} 
              trend={{ value: `-${transactions.filter((t: any) => t.type === 'expense').length} 笔`, positive: false }}
            />
          </div>

          <h2 className="section-title">最近交易</h2>
          <TransactionsList transactions={recentTransactions} />
        </>
      )}
    </div>
  )
}

export default Dashboard