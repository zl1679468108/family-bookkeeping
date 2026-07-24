/**
 * BookSettings 图标选择 class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildBookEmojiItemClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bs-emoji-item'
  return cx(prefix, opts.selected && `${prefix}--selected`, opts.className)
}

export function buildBookEmojiLabelClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bs-emoji-item__label'
  return cx(prefix, opts.selected && `${prefix}--selected`, opts.className)
}

export function buildBookCustomIconItemClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bs-custom-icon-item'
  return cx(prefix, opts.selected && `${prefix}--selected`, opts.className)
}

export function buildBookMoreArrowClassName(opts: {
  open?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'bs-more-row__arrow'
  return cx(prefix, opts.open && `${prefix}--open`, opts.className)
}
