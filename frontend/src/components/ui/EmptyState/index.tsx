import React, { useMemo } from 'react'
import { resolveEmptyStateText, resolveEmptyIconSize, buildEmptyStateClassName } from '../../../utils/emptyState'
import { getEmptyIllustrationDataUrl } from './emptyIllustration'
import { getThemeColors } from '../../../utils/themeColors'
import { useTheme } from '../../../utils/theme'

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

const EmptyIllustration: React.FC<{ size: number }> = ({ size }) => {
  const { resolvedTheme } = useTheme()
  const src = useMemo(
    () => getEmptyIllustrationDataUrl(getThemeColors()),
    [resolvedTheme],
  )

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ display: 'block', width: size, height: size }}
    />
  )
}

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
  const resolvedIconSize = resolveEmptyIconSize(variant, 'web', iconSize)

  const renderIcon = icon ?? <EmptyIllustration size={resolvedIconSize} />
  const text = resolveEmptyStateText(description, title)

  return (
    <div
      className={buildEmptyStateClassName(variant, className)}
      style={style}
    >
      {renderIcon ? <div className="empty-state__icon">{renderIcon}</div> : null}
      {text ? <div className="empty-state__desc">{text}</div> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export default EmptyState
