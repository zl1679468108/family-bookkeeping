/**
 * AppSection class — Taro 页面区块
 */

import { cx, type ClassValue } from './cx'

export function buildAppSectionClassName(opts: {
  compact?: boolean
  flush?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'app-section'
  return cx(
    prefix,
    opts.compact && `${prefix}--compact`,
    opts.flush && `${prefix}--flush`,
    opts.className,
  )
}

export function buildAppSectionBodyClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'app-section__body'
  return cx(prefix, opts.className)
}
