/**
 * Books / Profile 等页面 class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildBookCardClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bk-card'
  return cx(prefix, opts.active && `${prefix}--active`, opts.className)
}

export function buildBookCardActionClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'book-card__action'
  return cx(prefix, opts.active && `${prefix}--active`, opts.className)
}

export function buildRoleBadgeClassName(opts: {
  role?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'role-badge'
  return cx(prefix, opts.role || null, opts.className)
}

export function buildMemberRoleTagClassName(opts: {
  owner?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bk-member-role-tag'
  return cx(prefix, opts.owner && `${prefix}--owner`, opts.className)
}

export function buildThemeToggleLabelClassName(opts: {
  dark?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'theme-toggle__label'
  return cx(prefix, opts.dark && `${prefix}--dark`, opts.className)
}

export function buildThemeToggleSwitchClassName(opts: {
  on?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'theme-toggle__switch'
  return cx(prefix, opts.on && `${prefix}--on`, opts.className)
}

export function buildSwitchAccountItemClassName(opts: {
  current?: boolean
  switching?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'switch-account-item'
  return cx(
    prefix,
    opts.current && 'current',
    opts.switching && 'switching',
    opts.className,
  )
}

export function buildFilterCardClassName(opts: {
  scrolled?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'filter-card'
  return cx(prefix, opts.scrolled && 'scrolled', opts.className)
}
