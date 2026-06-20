import * as React from 'react'
import { formatAmount } from '../../../utils/common'
import './index.scss'

/**
 * 排行/预算进度行组件 —— Reports / Budgets 等页面通用
 */
export interface RankRowItem {
  id: string | number
  icon?: React.ReactNode
  label: React.ReactNode
  amount?: number
  totalAmount?: number
  progress?: number
  meta?: React.ReactNode
  type?: 'income' | 'expense' | 'neutral'
  status?: 'safe' | 'warn' | 'danger'
  onClick?: () => void
}

export const RankRow: React.FC<RankRowItem> = ({
  icon,
  label,
  amount,
  totalAmount,
  progress,
  meta,
  type = 'expense',
  status,
  onClick,
}) => {
  const progressPercent =
    progress !== undefined
      ? progress
      : totalAmount !== undefined && totalAmount > 0 && amount !== undefined
        ? Math.round((amount / totalAmount) * 100)
        : undefined

  const fillClass =
    status === 'danger'
      ? 'danger'
      : status === 'warn'
        ? 'warn'
        : type === 'income'
          ? 'income'
          : 'safe'

  return (
    <div
      className="rank-row"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="rank-row__info">
        <span className="rank-row__name">
          {icon && <span className="rank-row__icon">{icon}</span>}
          {label}
        </span>
        {amount !== undefined && (
          <span className="rank-row__amount">
            {totalAmount !== undefined
              ? `${formatAmount(amount)} / ${formatAmount(totalAmount)}`
              : formatAmount(amount)}
          </span>
        )}
      </div>
      {progressPercent !== undefined && (
        <div className="rank-row__bar">
          <div className={`fill ${fillClass}`} style={{ width: `${Math.min(progressPercent, 100)}%` }} />
        </div>
      )}
      <div className="rank-row__meta">
        {progressPercent !== undefined && `${progressPercent}%`}
        {status === 'danger' && progressPercent !== undefined && ' 超支!'}
        {meta && <span className="rank-row__extra">{meta}</span>}
      </div>
    </div>
  )
}

export default RankRow
