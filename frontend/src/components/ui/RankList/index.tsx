import React from 'react'
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

/**
 * 排行榜列表 —— 显示分类/成员排名，带金额占比进度条
 */
export interface ReportRankItem {
  id: string | number
  icon?: React.ReactNode
  label: React.ReactNode
  amount: number
  type: 'expense' | 'income'
  tag?: string
  onClick?: () => void
}

export const ReportRankList: React.FC<{
  items: ReportRankItem[]
  emptyText?: string
}> = ({ items, emptyText = '暂无数据' }) => {
  if (items.length === 0) {
    return <div className="rank-list__empty">{emptyText}</div>
  }

  const total = items.reduce((s, d) => s + Number(d.amount), 0)

  return (
    <div className="report-rank-list">
      {items.map((item) => {
        const pct = total > 0 ? (item.amount / total) * 100 : 0
        const colorVar = item.type === 'expense' ? 'var(--exp)' : 'var(--inc)'
        return (
          <div key={item.id} className="report-rank-item" onClick={item.onClick} style={item.onClick ? { cursor: 'pointer' } : undefined}>
            <div className="report-rank-item__top">
              <span className="report-rank-item__name">
                {item.icon} {item.label}
                {item.tag && (
                  <span className="report-rank-item__tag" style={{ color: colorVar }}>
                    {item.tag}
                  </span>
                )}
              </span>
              <span className="report-rank-item__amount" style={{ color: colorVar }}>
                {formatAmount(item.amount)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="report-rank-item__bar">
              <div style={{ height: '100%', width: `${pct}%`, background: colorVar, borderRadius: 2, transition: 'width 0.35s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RankRow
