/**
 * PageLayout class — Taro 页面壳
 */

import { cx, type ClassValue } from './cx'

/** 自定义 TabBar 底部内容占位（rpx，不含 safe-area；PageLayout bottomSpace 会再叠加 safe-area） */
export const TAB_BAR_BOTTOM_SPACE_RPX = 160

export function buildPageLayoutClassName(opts: {
  themeClass?: string
  className?: ClassValue
  prefix?: string
  base?: string
} = {}): string {
  const base = opts.base || 'bg-bg flex flex-col page-layout'
  return cx(base, opts.themeClass, opts.className)
}

export function buildPageLayoutContentClassName(opts: {
  className?: ClassValue
  extra?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'page-layout-content'
  return cx(prefix, opts.extra, opts.className)
}

export function buildPageLayoutInnerClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'page-layout-inner'
  return cx(prefix, opts.className)
}
