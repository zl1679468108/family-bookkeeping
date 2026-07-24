import * as React from 'react'
import { getPlatformIconByKey } from './shoppingPlatformIcons'
import { isIconUrl } from '../../../shared-utils/src/platformIcons'
import { renderBookIcon } from './bookIcons'
import { resolveCategoryIconKind, platformIconKey } from './categoryIcon'

/**
 * 根据 icon 值渲染正确的图标：
 * - URL (http/https) → <img>
 * - "platform_xxx" → 对应购物平台 SVG 图标
 * - 账本图标 key → 账本 SVG
 * - 其他 → 按 emoji/纯文本渲染
 */
export const renderCategoryIcon = (
  icon: string | undefined,
  options: { size?: number; className?: string } = {},
): React.ReactNode => {
  const kind = resolveCategoryIconKind(icon)
  if (kind === 'empty' || !icon) return null

  const { size = 20, className = '' } = options

  if (kind === 'url') {
    return (
      <img
        src={icon}
        alt=""
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      />
    )
  }

  if (kind === 'platform') {
    const svg = getPlatformIconByKey(platformIconKey(icon))
    if (svg) return svg
    return '📌'
  }

  if (kind === 'book') {
    return renderBookIcon(icon)
  }

  return <span style={{ fontSize: size }}>{icon}</span>
}

export { isIconUrl } from '../../../shared-utils/src/platformIcons'
