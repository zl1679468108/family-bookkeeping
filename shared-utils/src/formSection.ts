/**
 * 记一笔表单区块 class — Taro ft-* 表单套件
 */

import { cx, type ClassValue } from './cx'
import type { TransactionTypeCode } from './transactionType'

export function buildFormSectionClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-section'
  return cx(prefix, opts.className)
}

export function buildFormFieldClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-field'
  return cx(prefix, opts.className)
}

export function buildFormFieldValueClassName(opts: {
  hasValue?: boolean
  className?: ClassValue
  valuePrefix?: string
  placeholderPrefix?: string
} = {}): string {
  const valuePrefix = opts.valuePrefix || 'ft-field-value'
  const placeholderPrefix = opts.placeholderPrefix || 'ft-field-placeholder'
  return cx(opts.hasValue ? valuePrefix : placeholderPrefix, opts.className)
}

export function buildTypeTabsClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-tabs'
  return cx(prefix, opts.className)
}

export function buildTypeTabClassName(opts: {
  active?: boolean
  type?: TransactionTypeCode | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-tab'
  return cx(
    prefix,
    opts.active && `${prefix}--active`,
    opts.active && opts.type && `${prefix}--${opts.type}`,
    opts.className,
  )
}

export function buildAmountCardClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-amt-card'
  return cx(prefix, opts.className)
}

export function buildNoteSectionClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-section'
  return cx(prefix, 'ft-note', opts.className)
}

export function buildLocationSectionClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ft-section'
  return cx(prefix, 'ft-loc', opts.className)
}
