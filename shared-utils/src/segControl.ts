/**
 * 分段控制器 class — PC SegControl / Taro ui-seg 共用
 */

import { cx, type ClassValue } from './cx'

export type SegControlSize = 'sm' | 'md'
export type SegControlVariant = 'default' | 'pill'

export type BuildSegControlClassNameOptions = {
  size?: SegControlSize
  variant?: SegControlVariant
  className?: ClassValue
  /** PC: seg-control；Taro: ui-seg */
  prefix?: string
}

export function buildSegControlClassName(
  opts: BuildSegControlClassNameOptions = {},
): string {
  const {
    size = 'md',
    variant = 'default',
    className = '',
    prefix = 'seg-control',
  } = opts
  return cx(prefix, `${prefix}--${size}`, `${prefix}--${variant}`, className)
}
