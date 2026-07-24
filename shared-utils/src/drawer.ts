/** Drawer 默认配置与 class — 双端语义对齐（PC 侧栏 / 小程序底部 sheet） */

import { cx, type ClassValue } from './cx'

/** PC 右侧抽屉默认宽度（px） */
export const DRAWER_DEFAULT_WIDTH_PX = 420

/** 默认 placement */
export const DRAWER_DEFAULT_PLACEMENT = 'right' as const

export type DrawerPlacement = 'left' | 'right'

/** PC Drawer 根 class：ui-drawer-root + is-open + left */
export function buildDrawerRootClassName(opts: {
  open?: boolean
  placement?: DrawerPlacement
  className?: ClassValue
  prefix?: string
} = {}): string {
  const placement = opts.placement || DRAWER_DEFAULT_PLACEMENT
  const prefix = opts.prefix || 'ui-drawer-root'
  return cx(
    prefix,
    opts.open && 'is-open',
    placement === 'left' && 'ui-drawer--left',
    opts.className,
  )
}

/** Taro 底部 Drawer 根 class */
export function buildDrawerSheetClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-drawer'
  return cx(prefix, opts.className)
}
