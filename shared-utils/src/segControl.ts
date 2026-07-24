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

/** 分段选项 class：PC seg-opt / Taro ui-seg__item */
export function buildSegOptionClassName(opts: {
  active?: boolean
  className?: ClassValue
  /** PC: seg-opt；Taro: ui-seg__item */
  prefix?: string
  /** pc: `active` 修饰；bem: `--active` */
  mode?: 'pc' | 'bem'
} = {}): string {
  const mode = opts.mode || 'pc'
  const prefix = opts.prefix || (mode === 'bem' ? 'ui-seg__item' : 'seg-opt')
  if (mode === 'bem') {
    return cx(prefix, opts.active && `${prefix}--active`, opts.className)
  }
  return cx(prefix, opts.active && 'active', opts.className)
}

