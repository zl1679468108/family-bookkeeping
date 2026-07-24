/**
 * List / ListItem class — Taro ui-list
 */

import { cx, type ClassValue } from './cx'

export function buildListClassName(opts: {
  inset?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-list'
  return cx(prefix, opts.inset && `${prefix}--inset`, opts.className)
}

export function buildListItemClassName(opts: {
  divider?: boolean
  clickable?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-list-item'
  return cx(
    prefix,
    opts.divider && `${prefix}--divider`,
    opts.clickable && `${prefix}--clickable`,
    opts.className,
  )
}
