/**
 * MenuList class — Taro 设置/个人页菜单
 */

import { cx, type ClassValue } from './cx'

export function buildMenuListClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'menu-list'
  return cx(prefix, opts.className)
}

export function buildMenuListItemClassName(opts: {
  danger?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'menu-list__item'
  return cx(prefix, opts.danger && `${prefix}--danger`, opts.className)
}
