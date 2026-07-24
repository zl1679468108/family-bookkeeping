/**
 * AuthLayout 装饰圆与 class — PC 鉴权页
 */

import { cx, type ClassValue } from './cx'

export type AuthDecoCircle = {
  width: number
  height: number
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/** 左侧插画面板装饰圆（px 定位） */
export const AUTH_DECO_CIRCLES: readonly AuthDecoCircle[] = [
  { width: 420, height: 420, top: -100, right: -120 },
  { width: 280, height: 280, bottom: -80, left: -60 },
  { width: 100, height: 100, top: 280, left: 120 },
] as const

export function buildAuthPageClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'auth-page'
  return cx(prefix, opts.className)
}

export function buildAuthIllusClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'auth-illus'
  return cx(prefix, opts.className)
}

export function buildAuthFormClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'auth-form'
  return cx(prefix, opts.className)
}

/** 装饰圆 inline style */
export function authDecoCircleStyle(circle: AuthDecoCircle): Record<string, number> {
  const style: Record<string, number> = {
    width: circle.width,
    height: circle.height,
  }
  if (circle.top != null) style.top = circle.top
  if (circle.right != null) style.right = circle.right
  if (circle.bottom != null) style.bottom = circle.bottom
  if (circle.left != null) style.left = circle.left
  return style
}
