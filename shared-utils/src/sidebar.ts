/**
 * Sidebar class — PC 侧栏
 */

import { cx, type ClassValue } from './cx'

export function buildSidebarClassName(opts: {
  collapsed?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'app-sidebar'
  return cx(prefix, opts.collapsed && 'collapsed', opts.className)
}

export function buildSidebarNavItemClassName(opts: {
  active?: boolean
  add?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'sidebar-nav-item'
  return cx(
    prefix,
    opts.active && 'active',
    opts.add && `${prefix}--add`,
    opts.className,
  )
}

export function buildSidebarUserArrowClassName(opts: {
  open?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'sidebar-user-arrow'
  return cx(prefix, opts.open && 'open', opts.className)
}

export function buildUserMenuItemClassName(opts: {
  danger?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'user-menu-item'
  return cx(prefix, opts.danger && `${prefix}--danger`, opts.className)
}
