/**
 * TabBar class — Taro 底部导航
 */

import { cx, type ClassValue } from './cx'

export function buildTabBarItemClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tab-bar-item'
  return cx(prefix, opts.active && `${prefix}--active`, opts.className)
}
