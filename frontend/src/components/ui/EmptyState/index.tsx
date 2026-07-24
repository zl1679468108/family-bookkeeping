import React from 'react'
import { getEmptyIllustrationDataUrl } from './emptyIllustration'

/**
 * 通用空状态组件 —— 取代各页面手写的暂无数据提示
 *
 * 与小程序端 EmptyState 对齐（统一空状态）：
 * - 不传 icon 时自动渲染全局统一插画（人物 + 空箱子 + 问号）
 * - 文案以 title 为主（各模块自定），可选 description / action
 * - variant: default / compact / full
 *
 * 用法：
 *  <EmptyState title="暂无数据" description="添加第一笔交易开始记账" />
 *  <EmptyState icon="📭" title="暂无数据" />            // 覆盖默认插画
 *  <EmptyState variant="compact" title="暂无结果" action={<Button>重置筛选</Button>} />
 */
interface EmptyStateProps {
  /** 自定义图标（emoji 或节点）；不传则使用全局统一插画 */
  icon?: React.ReactNode
  /** 主文案（各模块自定） */
  title?: React.ReactNode
  /** 补充说明 */
  description?: React.ReactNode
  /** 操作区（如按钮） */
  action?: React.ReactNode
  /** 尺寸变体 */
  variant?: 'default' | 'compact' | 'full'
  /** 默认插画尺寸（px），不传按 variant 给默认值 */
  iconSize?: number
  className?: string
  style?: React.CSSProperties
}

const EMPTY_ILLUSTRATION_SRC = getEmptyIllustrationDataUrl()

/** 全局统一空状态插画 */
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
  // 插画默认尺寸：compact 100 / default 150 / full 180
  const resolvedIconSize =
    iconSize ?? (variant === 'compact' ? 100 : variant === 'full' ? 180 : 150)

  const renderIcon =
    icon ?? <EmptyIllustration size={resolvedIconSize} />

  return (
    <div
      className={`empty-state empty-state--${variant} ${className}`.trim()}
      style={style}
    >
      {renderIcon ? <div className="empty-state__icon">{renderIcon}</div> : null}
      {title ? <div className="empty-state__title">{title}</div> : null}
      {description ? (
        <div className="empty-state__desc">{description}</div>
      ) : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export default EmptyState
