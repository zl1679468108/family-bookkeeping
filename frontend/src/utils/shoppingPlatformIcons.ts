/**
 * 购物平台图标 — 纯数据见 shared-utils；本文件保留 PC React 渲染。
 */
import * as React from 'react'
import {
  PLATFORM_SVG_MAP,
  type PlatformSvgSpec,
} from '../../../shared-utils/src/platformIcons'

export {
  SHOPPING_PLATFORM_ICONS,
  PLATFORM_SVG_MAP,
  getPlatformIconSpecByKey,
  isPlatformIcon,
  buildPlatformIconSvgString,
  getPlatformIconSvgDataUrl,
  isIconUrl,
} from '../../../shared-utils/src/platformIcons'
export type { PlatformIconItem, PlatformSvgSpec } from '../../../shared-utils/src/platformIcons'

const SVG_STYLE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const renderSvgChildren = (spec: PlatformSvgSpec): React.ReactNode =>
  spec.children.map((child, idx) =>
    React.createElement(child.tag as keyof JSX.IntrinsicElements, {
      key: `${child.tag}-${idx}`,
      ...child.attrs,
    }),
  )

/** 根据平台 key 获取对应的图标 ReactNode */
export const getPlatformIconByKey = (iconKey: string): React.ReactNode => {
  const spec = PLATFORM_SVG_MAP[iconKey]
  if (!spec) return null

  return React.createElement(
    'svg',
    {
      width: spec.width,
      height: spec.height,
      viewBox: spec.viewBox,
      ...SVG_STYLE_PROPS,
    },
    renderSvgChildren(spec),
  )
}
