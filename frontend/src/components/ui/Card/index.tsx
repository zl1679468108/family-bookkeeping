import React from 'react'
import {
  buildCardClassName,
  buildCardHeaderClassName,
  buildCardContentClassName,
  type CardPadding,
} from '../../../utils/card'

/**
 * 通用卡片容器
 */
export function Card({
  children,
  className = '',
  style,
  padding = 'md',
}: {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  padding?: CardPadding
}) {
  return (
    <div className={buildCardClassName({ padding, className, mode: 'pc' })} style={style}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subTitle,
  action,
  className = '',
  style,
}: {
  title?: React.ReactNode
  subTitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={buildCardHeaderClassName({ className, mode: 'pc' })} style={style}>
      <div className="card-header-text">
        {title && <h3 className="card-title">{title}</h3>}
        {subTitle && <span className="card-subtitle">{subTitle}</span>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  )
}

export function CardContent({
  children,
  className = '',
  style,
}: {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={buildCardContentClassName({ className, mode: 'pc' })} style={style}>
      {children}
    </div>
  )
}

export default Card
