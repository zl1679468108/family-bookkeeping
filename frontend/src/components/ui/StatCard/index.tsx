import React from 'react'
import {
  buildStatCardClassName,
  type StatCardVariant,
} from '../../../utils/statCard'

/**
 * 统计卡片组件 —— Dashboard 等页面展示关键指标
 *
 * 用法：
 *  <StatCard label="本月支出" value="¥12,345" variant="expense" icon="💸" />
 *  <StatCard label={<span>结余</span>} value={formatted} sub="较上月+12%" variant="hero" />
 */
interface StatCardProps {
  label: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: React.ReactNode
  variant?: StatCardVariant
  className?: string
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  icon,
  variant = 'default',
  className = '',
  onClick,
}) => {
  return (
    <div
      className={buildStatCardClassName({ variant, className, mode: 'pc' })}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {icon && (
        <div className="stat-card__header">
          <div className="stat-card__icon">{icon}</div>
        </div>
      )}
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  )
}

export default StatCard
