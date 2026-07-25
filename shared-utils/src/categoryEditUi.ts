/**
 * CategoryEdit class — Taro 分类编辑页选中态/操作态
 */

import { cx, type ClassValue } from './cx'

export function buildCategoryEditTypeTabClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'catedit-type-tab'
  return cx(prefix, opts.active && `${prefix}--active`, opts.className)
}

export function buildCategoryEditChoiceClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix: string
}): string {
  const prefix = opts.prefix
  return cx(prefix, opts.selected && `${prefix}--selected`, opts.className)
}

export function buildCategoryEditSaveClassName(opts: {
  full?: boolean
  disabled?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'catedit-actions__save'
  return cx(
    prefix,
    opts.full && `${prefix}--full`,
    opts.disabled && `${prefix}--disabled`,
    opts.className,
  )
}
