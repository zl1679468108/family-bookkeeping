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

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, isBalance }) => {
  return (
    <div className={`card ${isBalance ? 'balance-card' : ''}`}>
      <div className="card-label">{label}</div>
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
          {trend.value}
        </div>
      )}
    </div>
  )
}