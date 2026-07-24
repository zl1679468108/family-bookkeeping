/**
 * Space 间距 — PC Space 组件共用
 */

import { cx, type ClassValue } from './cx'

export type SpaceSize = 'xs' | 'sm' | 'md' | 'lg'
export type SpaceDirection = 'horizontal' | 'vertical'

/** 间距 token（px） */
export const SPACE_GAP_PX: Record<SpaceSize, string> = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
}

export function resolveSpaceGap(size: SpaceSize = 'md'): string {
  return SPACE_GAP_PX[size] || SPACE_GAP_PX.md
}

export function buildSpaceClassName(opts: {
  size?: SpaceSize
  direction?: SpaceDirection
  className?: ClassValue
  prefix?: string
} = {}): string {
  const size = opts.size || 'md'
  const direction = opts.direction || 'horizontal'
  const prefix = opts.prefix || 'space'
  return cx(prefix, `${prefix}--${direction}`, `${prefix}--${size}`, opts.className)
}
