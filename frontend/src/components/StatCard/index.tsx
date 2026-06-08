import React from 'react'
import './index.scss'

interface StatCardProps {
  label: string
  value: string
  trend?: {
    value: string
    positive: boolean
  }
  isBalance?: boolean
}

const getIcon = (isBalance: boolean | undefined, label: string) => {
  if (isBalance) {
    // 结余图标
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    )
  }
  if (label.includes('收入')) {
    // 收入图标：向下箭头 + 圆圈
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <polyline points="8 12 12 16 16 12"></polyline>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    )
  }
  if (label.includes('支出')) {
    // 支出图标：向上箭头 + 圆圈
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <polyline points="8 12 12 8 16 12"></polyline>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    )
  }
  return null
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, isBalance }) => {
  return (
    <div className={`card ${isBalance ? 'balance-card' : ''} ${!isBalance && label.includes('收入') ? 'income-card' : ''} ${!isBalance && label.includes('支出') ? 'expense-card' : ''}`}>
      <div className="card-header">
        <div className="card-icon">
          {getIcon(isBalance, label)}
        </div>
        <div className="card-label">{label}</div>
      </div>
      <div className="card-value">{value}</div>
      {trend && (
        <div className={`card-trend ${trend.positive ? 'positive' : 'negative'}`}>
          {trend.positive ? (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 13a1 1 0 110 2h5a1 1 0 011-1v-5a1 1 0 11-2 0v1.586l-4.293-4.293a1 1 0 01-1.414 0L8 9.586l-4.293-4.293a1 1 0 01-1.414 1.414l5 5a1 1 0 011.414 0L11 9.414 14.586 13H12z" clipRule="evenodd"/>
            </svg>
          )}
          <span className="trend-value">{trend.value}</span>
          <span className="trend-label">较上月</span>
        </div>
      )}
    </div>
  )
}