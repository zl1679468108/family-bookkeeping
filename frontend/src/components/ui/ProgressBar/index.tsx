import React from 'react'
import './index.scss'

/**
 * 通用进度条组件
 *
 * 用法：
 *  <ProgressBar value={75} />
 *  <ProgressBar value={60} variant="expense" label="¥600 / ¥1000" />
 */
interface ProgressBarProps {
  value: number
  max?: number
  label?: React.ReactNode
  variant?: 'default' | 'income' | 'expense' | 'warn' | 'danger' | 'safe'
  showPercentage?: boolean
  className?: string
  style?: React.CSSProperties
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  variant = 'default',
  showPercentage = false,
  className = '',
  style,
}) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`progress-bar-wrap ${className}`.trim()} style={style}>
      {(label || showPercentage) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showPercentage && <span className="progress-bar__percent">{percent.toFixed(0)}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div className={`progress-bar__fill progress-bar__fill--${variant}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
