import React from 'react'
import './index.scss'

/**
 * 通用空状态组件 —— 取代各页面手写的暂无数据提示
 *
 * 用法：
 *  <EmptyState icon="📭" title="暂无数据" description="添加第一笔交易开始记账" />
 *  <EmptyState variant="compact" title="暂无结果" action={<Button>重置筛选</Button>} />
 */
interface EmptyStateProps {
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'compact' | 'full'
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  style,
  variant = 'default',
}) => {
  return (
    <div
      className={`empty-state empty-state--${variant} ${className}`.trim()}
      style={style}
    >
      {icon && <div className="empty-state__icon">{icon}</div>}
      {title && <div className="empty-state__title">{title}</div>}
      {description && <div className="empty-state__desc">{description}</div>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}

export default EmptyState
