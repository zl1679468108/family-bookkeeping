/**
 * 类型标签 class — 模板/分类详情收支 tag
 */

import { cx, type ClassValue } from './cx'
import { isExpenseType } from './transactionType'

export function buildDetailTypeTagClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'detail-tag'
  const tone = isExpenseType(opts.type) ? 'type-expense' : 'type-income'
  return cx(prefix, tone, opts.className)
}

export function buildDetailDefaultTagClassName(opts: {
  isDefault?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'detail-tag'
  return cx(prefix, opts.isDefault ? 'tag-default' : 'tag-custom', opts.className)
}

export function buildCategoryDetailTypeBadgeClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'catds-badge'
  const tone = isExpenseType(opts.type) ? `${prefix}--expense` : `${prefix}--income`
  return cx(prefix, `${prefix}--type`, tone, opts.className)
}

export function buildCategoryDetailOriginBadgeClassName(opts: {
  isDefault?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'catds-badge'
  const tone = opts.isDefault ? `${prefix}--default` : `${prefix}--custom`
  return cx(prefix, `${prefix}--origin`, tone, opts.className)
}

export function buildTemplateTypeTagClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-tag'
  const type = opts.type || 'expense'
  return cx(prefix, 'tpl-tag-type', `tpl-tag-${type}`, opts.className)
}

export function buildTemplateAmountTagClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-tag'
  const type = opts.type || 'expense'
  return cx(prefix, 'tpl-tag-amount', `tpl-tag-${type}`, opts.className)
}

export function buildTemplateDetailTypeTagClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-tag'
  const type = opts.type || 'expense'
  return cx(prefix, `${prefix}--type`, `${prefix}--${type}`, opts.className)
}

export function buildTemplateDetailAmountTagClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-tag'
  const type = opts.type || 'expense'
  return cx(prefix, `${prefix}--amount`, `${prefix}--${type}`, opts.className)
}

export function buildTemplateCardTypeClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-card__type'
  const type = opts.type || 'expense'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}

export function buildTemplateCardAmountClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-card__amount'
  const type = opts.type || 'expense'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}
