/**
 * 账本图标 — 纯数据与 SVG 工具见 shared-utils；本文件仅保留 PC React 渲染。
 */
import * as React from 'react'
import {
  getBookIconSpecByKey,
  isCustomIconUrl,
  type BookIconSvgSpec,
} from '../../../shared-utils/src/bookIcons'

export {
  BOOK_ICONS,
  BOOK_ICON_SVG_MAP,
  getBookIconSpecByKey,
  getBookEmojiByKey,
  getBookEmoji,
  getBookEmojiByIconOrId,
  isCustomIconUrl,
  isBookIconKey,
  buildBookIconSvgString,
  getBookIconSvgDataUrl,
} from '../../../shared-utils/src/bookIcons'
export type { BookIconItem, BookIconSvgSpec } from '../../../shared-utils/src/bookIcons'

const SVG_STYLE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const renderSvgChildren = (spec: BookIconSvgSpec): React.ReactNode =>
  spec.children.map((child, idx) =>
    React.createElement(child.tag as keyof JSX.IntrinsicElements, {
      key: `${child.tag}-${idx}`,
      ...child.attrs,
    }),
  )

/** 将 SVG 规格渲染为 ReactNode（icon-grid / bk-icon / detail-icon） */
export const renderBookIcon = (iconKey?: string): React.ReactNode => {
  if (isCustomIconUrl(iconKey)) {
    return React.createElement('img', {
      src: iconKey,
      alt: '',
      style: {
        width: 24,
        height: 24,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
      },
    })
  }
  const spec = getBookIconSpecByKey(iconKey)
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

export const getBookIconByKey = (iconKey?: string): React.ReactNode => renderBookIcon(iconKey)
