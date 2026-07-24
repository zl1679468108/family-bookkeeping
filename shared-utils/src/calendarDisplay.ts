/**
 * Calendar 结余展示 class — PC
 */

import { cx, type ClassValue } from './cx'

export function buildCalendarBalanceClassName(opts: {
  nonNegative?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'cs-val'
  return cx(prefix, opts.nonNegative ? 'inc' : 'exp', opts.className)
}
