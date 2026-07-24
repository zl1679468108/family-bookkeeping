import React from 'react'
import { getEmptyIllustrationDataUrl } from './emptyIllustration'

/**
 * 通用空状态：统一插画 + 一段描述（无标题层级）
 *
 * - 不传 icon 时渲染全局插画（人物 + 空箱子 + 问号）
 * - 文案优先用 description；未传时回退 title（兼容旧调用）
 * - 可选 action
 *
 * 用法：
 *  <EmptyState description="暂无交易记录，记一笔开始记账" />
 *  <EmptyState description="暂无数据" action={<Button>去添加</Button>} />
 */
interface EmptyStateProps {
  /** 自定义图标；不传则使用全局统一插画 */
  icon?: React.ReactNode
  /**
   * @deprecated 请用 description。保留仅为兼容旧调用，会按描述样式渲染。
   */
  title?: React.ReactNode
  /** 描述文案（主文案） */
  description?: React.ReactNode
  /** 操作区（如按钮） */
  action?: React.ReactNode
  variant?: 'default' | 'compact' | 'full'
  /** 插画尺寸（px） */
  iconSize?: number
  className?: string
  style?: React.CSSProperties
}

const EMPTY_ILLUSTRATION_SRC = getEmptyIllustrationDataUrl()

const EmptyIllustration: React.FC<{ size: number }> = ({ size }) => (
  <img
    src={EMPTY_ILLUSTRATION_SRC}
    width={size}
    height={size}
    alt=""
    aria-hidden="true"
    draggable={false}
    style={{ display: 'block', width: size, height: size }}
  />
)

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  style,
  variant = 'default',
  iconSize,
}) => {
  const resolvedIconSize =
    iconSize ?? (variant === 'compact' ? 100 : variant === 'full' ? 180 : 150)

  const renderIcon = icon ?? <EmptyIllustration size={resolvedIconSize} />
  // 一段描述：优先 description，兼容旧 title
  // 单段文案：优先 description；两者皆有且为字符串时合并，避免旧调用丢标题
  const text =
    description != null && title != null && description !== title
      ? typeof description === 'string' && typeof title === 'string'
        ? `${title}。${description}`
        : description
      : description ?? title

  return (
    <div
      className={`empty-state empty-state--${variant} ${className}`.trim()}
      style={style}
    >
      {renderIcon ? <div className="empty-state__icon">{renderIcon}</div> : null}
      {text ? <div className="empty-state__desc">{text}</div> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export default EmptyState
