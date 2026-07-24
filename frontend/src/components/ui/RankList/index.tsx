import * as React from 'react'
import { formatAmount, formatAmountPair } from '../../../utils/common'
import { resolveRankProgress, clampPercent, rankFillTone, type RankType, type RankStatus } from '../../../utils/rankProgress'
import { buildRankRowClassName } from '../../../utils/rankRow'
import { BUDGET_LABEL_OVER_BANG } from '../../../utils/budget'

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
  type?: RankType
  status?: RankStatus
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
  const progressPercent = resolveRankProgress(amount, totalAmount, progress)
  const fillClass = rankFillTone(status, type === 'neutral' ? 'expense' : type)

  return (
    <div
      className={buildRankRowClassName({ type, status, clickable: !!onClick, mode: 'pc' })}
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
              ? `${formatAmountPair(amount, totalAmount)}`
              : formatAmount(amount)}
          </span>
        )}
      </div>
      {(progressPercent !== undefined || meta) && (
        <div className="rank-row__progress">
          {progressPercent !== undefined && (
            <div className="rank-row__bar">
              <div className={`fill ${fillClass}`} style={{ width: `${clampPercent(progressPercent)}%` }} />
            </div>
          )}
          <div className="rank-row__meta">
            {progressPercent !== undefined && `${progressPercent}%`}
            {status === 'danger' && progressPercent !== undefined && BUDGET_LABEL_OVER_BANG}
            {meta && <span className="rank-row__extra">{meta}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default RankRow
