/**
 * 指标色调 / class — PC MetricRow / Taro MetricGrid 共用
 */

import { cx, type ClassValue } from './cx'

export type MetricTone = 'default' | 'income' | 'expense' | 'accent'

export function buildMetricItemClassName(opts: {
  tone?: MetricTone
  className?: ClassValue
  /** PC: metric-row__item；Taro: metric-card */
  prefix?: string
} = {}): string {
  const tone = opts.tone || 'default'
  const prefix = opts.prefix || 'metric-row__item'
  return cx(prefix, `${prefix}--${tone}`, opts.className)
}

export function buildMetricRowClassName(opts: {
  size?: 'md' | 'lg'
  centered?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const {
    size = 'lg',
    centered = true,
    className = '',
    prefix = 'metric-row',
  } = opts
  return cx(
    prefix,
    `${prefix}--${size}`,
    centered && `${prefix}--centered`,
    className,
  )
}

export function buildMetricGridClassName(opts: {
  columns?: 2 | 3 | 4
  className?: ClassValue
  prefix?: string
} = {}): string {
  const columns = opts.columns || 2
  const prefix = opts.prefix || 'metric-grid'
  return cx(prefix, `${prefix}--${columns}`, opts.className)
}
