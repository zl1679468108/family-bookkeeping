import React from 'react'
import './index.scss'

interface ChartCardProps {
  title: string
  selectOptions?: string[]
  chartType: 'trend' | 'pie'
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, selectOptions, chartType }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        {selectOptions && (
          <select className="form-select" style={{ width: 'auto', padding: '6px 32px 6px 12px' }}>
            {selectOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )}
      </div>
      <div className="chart-placeholder">
        {chartType === 'trend' ? (
          <>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12h4l3 9 4-16 3 6h4"/>
            </svg>
            <span style={{ marginLeft: '12px' }}>支出趋势图表</span>
          </>
        ) : (
          <>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            <span style={{ marginLeft: '12px' }}>分类占比</span>
          </>
        )}
      </div>
    </div>
  )
}