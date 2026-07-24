import React from 'react'
export { ICON_COLOR } from '../../../utils/iconColor'
import {
  getLineIconSpec,
  isLineIconName,
  type LineIconName,
} from '../../../utils/lineIcons'

/**
 * PC 端线框图标 — 规格见 shared-utils/lineIcons，统一 currentColor 着色。
 * 用于侧栏、菜单、关闭/导航等，不替代分类 emoji / 自定义图标。
 */

export type IconName = LineIconName

/** 语义色快捷，避免业务层硬编码 hex */

interface IconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
  strokeWidth?: number
  title?: string
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 16,
  color,
  className = '',
  strokeWidth = 2,
  title,
}) => {
  if (!isLineIconName(name)) return null
  const spec = getLineIconSpec(name)

  return (
    <svg
      width={size}
      height={size}
      viewBox={spec.viewBox}
      fill="none"
      stroke={color || 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `ui-icon ${className}` : 'ui-icon'}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {spec.children.map((child, idx) =>
        React.createElement(child.tag as keyof JSX.IntrinsicElements, {
          key: `${child.tag}-${idx}`,
          ...child.attrs,
        }),
      )}
    </svg>
  )
}

export default Icon
