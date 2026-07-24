/**
 * StickyActionBar class — 双端底栏共用
 */

import { cx, type ClassValue } from './cx'

export type StickyActionBarTone = 'solid' | 'blur'

export function buildStickyActionBarClassName(opts: {
  tone?: StickyActionBarTone
  row?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const tone = opts.tone || 'solid'
  const prefix = opts.prefix || 'ui-sticky-actions'
  return cx(
    prefix,
    `${prefix}--${tone}`,
    opts.row && `${prefix}--row`,
    opts.className,
  )
}
