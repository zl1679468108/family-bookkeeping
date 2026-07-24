/**
 * 预算进度展示 class — Dashboard / Home / Budgets
 */

import { cx, type ClassValue } from './cx'
import type { BudgetVariant } from './budget'

export function buildBudgetSummaryClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dash-budget-summary'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

export function buildBudgetSummaryPctClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dash-budget-summary__pct'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

export function buildBudgetSummaryFillClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dash-budget-summary__fill'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

export function buildBudgetItemClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dash-budget-item'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

export function buildBudgetItemBadgeClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dash-budget-item__badge'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

export function buildBudgetItemFillClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dash-budget-item__fill'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

/** Taro Home budget card bar */
export function buildBudgetCardBarClassName(opts: {
  variant?: BudgetVariant | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'budget-card__bar'
  const variant = opts.variant || 'safe'
  return cx(prefix, `${prefix}--${variant}`, opts.className)
}

export function buildBudgetCardRowOverClassName(opts: {
  over?: boolean
  part?: 'amt' | 'bar' | 'pct'
  className?: ClassValue
  prefix?: string
}): string {
  const part = opts.part || 'amt'
  const base = opts.prefix || `budget-card__row-${part}`
  return cx(base, opts.over && `${base}--over`, opts.className)
}
