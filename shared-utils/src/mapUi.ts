/**
 * Map UI class — PC 商户抽屉 / 商户交易历史
 */

import { cx, type ClassValue } from './cx'

export function merchantHistoryFilterLabel(label: string, count: number): string {
  return `${label} (${Number(count) || 0})`
}

export function buildMerchantDrawerItemClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'merchant-drawer__item'
  return cx(prefix, opts.selected && 'is-selected', opts.className)
}

export function buildMerchantHistoryItemClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'merchant-history-item'
  return cx(prefix, opts.type || null, opts.className)
}

export function buildMerchantHistoryTypeClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'history-item-type'
  return cx(prefix, opts.type || null, opts.className)
}

export function buildMerchantHistoryAmountClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'history-item-amount'
  return cx(prefix, opts.type || null, opts.className)
}
