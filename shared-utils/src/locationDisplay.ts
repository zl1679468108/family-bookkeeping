/**
 * LocationDisplay class — PC 位置回显
 */

import { cx, type ClassValue } from './cx'

export function buildLocationDisplayClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'loc-display'
  return cx(prefix, opts.className)
}

export function buildLocationDisplayBtnClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'loc-display-btn'
  return cx(prefix, opts.className)
}
