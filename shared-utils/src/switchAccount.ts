/**
 * SwitchAccountModal class — PC 切换账号
 */

import { cx, type ClassValue } from './cx'

export function buildAccountItemClassName(opts: {
  current?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'account-item'
  return cx(prefix, opts.current && 'current', opts.className)
}

export function buildSwitchAccountOverlayClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'switch-account-overlay'
  return cx(prefix, opts.className)
}

export function buildSwitchAccountModalClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'switch-account-modal'
  return cx(prefix, opts.className)
}
