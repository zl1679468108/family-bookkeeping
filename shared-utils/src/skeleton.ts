import { cx, type ClassValue } from './cx'

/**
 * Skeleton 尺寸预设 — PC / Taro 共用默认值
 * 端侧组件仍可覆盖 props
 */

export const SKELETON_DEFAULT_WIDTH = '100%'
export const SKELETON_DEFAULT_HEIGHT = '20px'
export const SKELETON_DEFAULT_RADIUS = '8px'

export const SKELETON_AVATAR_SIZE = 40
export const SKELETON_BUTTON_WIDTH = 80
export const SKELETON_BUTTON_HEIGHT = 32
export const SKELETON_INPUT_HEIGHT = 40
export const SKELETON_TEXT_LINE_HEIGHT = 14
export const SKELETON_TEXT_LINE_RADIUS = '4px'
export const SKELETON_TEXT_LINE_GAP = '8px'

/** 多行文案骨架默认宽度比例（第 1/2/3 行） */
export const SKELETON_TEXT_LINE_WIDTHS = ['100%', '90%', '75%'] as const

/** number → px 字符串，已是 string 原样返回 */
export function skeletonDim(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

/** 第 i 行（0-based）默认宽度；超出则用最后一档 */
export function skeletonTextLineWidth(index: number): string {
  const widths = SKELETON_TEXT_LINE_WIDTHS
  if (index < 0) return widths[0]
  if (index >= widths.length) return widths[widths.length - 1]
  return widths[index]
}

/** PC skeleton-shimmer 根 */
export function buildSkeletonClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'skeleton-shimmer'
  return cx(prefix, opts.className)
}

/** Taro ui-skeleton 根 */
export function buildUiSkeletonClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-skeleton'
  return cx(prefix, opts.className)
}

export function buildUiSkeletonGridClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-skeleton-grid'
  return cx(prefix, opts.className)
}

export function buildUiSkeletonStatsClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-skeleton-stats'
  return cx(prefix, opts.className)
}

export function buildUiSkeletonRowClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-skeleton-row'
  return cx(prefix, opts.className)
}

