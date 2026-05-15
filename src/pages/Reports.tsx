import React from 'react'
import { Header } from '../components/Header/Header'
import { ChartCard } from '../components/ChartCard/ChartCard'
import { StatCard } from '../components/StatCard/StatCard'
import { categoryDict } from '../utils/commonDic'
import { formatAmount } from '../utils/common'

interface CategoryStatData {
  category: string
  amount: number
}

const categoryStatsData: CategoryStatData[] = [
  { category: 'food', amount: 2450 },
  { category: 'housing', amount: 3500 },
  { category: 'transport', amount: 1200 },
  { category: 'utilities', amount: 280 },
  { category: 'shopping', amount: 910 }
]

const totalAmount = categoryStatsData.reduce((sum, item) => sum + item.amount, 0)

const categoryStats = categoryStatsData.map((item) => {
  const categoryInfo = categoryDict[item.category as keyof typeof categoryDict] || { name: '其他', icon: '📌' }
  const percentage = ((item.amount / totalAmount) * 100).toFixed(0)
  
  return {
    label: `${categoryInfo.icon} ${categoryInfo.name}`,
    value: formatAmount(item.amount),
    percentage: `${percentage}%`
  }
})

const Reports: React.FC = () => {
  return (
    <div>
      <Header title="统计报表" />

      <div className="charts-grid">
        <ChartCard 
          title="支出趋势" 
          selectOptions={['最近6个月', '最近3个月', '最近1年']}
          chartType="trend"
        />
        <ChartCard 
          title="支出分类" 
          chartType="pie"
        />
      </div>

      <h2 className="section-title">本月支出分类</h2>
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {categoryStats.map((stat, index) => (
          <div key={index} className="card" style={{ textAlign: 'center' }}>
            <div className="card-label" style={{ marginBottom: '12px' }}>{stat.label}</div>
            <div className="card-value" style={{ fontSize: '24px' }}>{stat.value}</div>
            <div className="card-trend">{stat.percentage}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reports