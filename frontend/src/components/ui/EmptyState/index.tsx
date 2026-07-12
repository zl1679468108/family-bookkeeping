import React from 'react'

/**
 * 通用空状态组件 —— 取代各页面手写的暂无数据提示
 *
 * 与小程序端 EmptyState 对齐（统一空状态）：
 * - 不传 icon 时自动渲染全局统一的「空盒子」线性图标（EmptyBoxIcon），
 *   颜色取中性灰、随明暗主题自适应，各模块无需各自维护图标。
 * - 标题 title 由各模块自定（核心可定制项）。
 * - 可选 description / action（如「去记一笔」按钮）。
 * - variant: default（居中带 action）/ compact（小尺寸）/ full（整屏）。
 * - iconSize: 默认图标尺寸（px），不传按 variant 给默认值。
 *
 * 用法：
 *  <EmptyState title="暂无数据" description="添加第一笔交易开始记账" />
 *  <EmptyState icon="📭" title="暂无数据" description="..." />            // 覆盖默认图标
 *  <EmptyState variant="compact" title="暂无结果" action={<Button>重置筛选</Button>} />
 */
interface EmptyStateProps {
  /** 自定义图标（emoji 或节点）；不传则使用全局统一的空状态图标 */
  icon?: React.ReactNode
  /** 标题（各模块自定，核心可定制项） */
  title?: React.ReactNode
  /** 补充说明 */
  description?: React.ReactNode
  /** 操作区（如按钮） */
  action?: React.ReactNode
  /** 尺寸变体 */
  variant?: 'default' | 'compact' | 'full'
  /** 默认图标尺寸（px），不传按 variant 给默认值 */
  iconSize?: number
  className?: string
  style?: React.CSSProperties
}

/** 全局统一空状态图标：空盒子线性图标（描边取 currentColor，随主题自适应） */
const EmptyBoxIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block' }}
  >
    {/* 托盘主体 */}
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    {/* 托盘内折线 */}
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
  </svg>
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
  // 与小程序端 rpx 等效：96/64/120 rpx ≈ 48/32/60 px（rpx 以 750 设计宽、2x 换算）
  const resolvedIconSize =
    iconSize ?? (variant === 'compact' ? 32 : variant === 'full' ? 60 : 48)

  const renderIcon =
    icon ?? <EmptyBoxIcon size={resolvedIconSize} />

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
