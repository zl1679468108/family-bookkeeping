/**
 * Card class — PC dash-card / Taro ui-card 共用
 */

import { cx, type ClassValue } from './cx'

export type CardPadding = 'sm' | 'md' | 'lg' | 'none'

/**
 * @param mode pc: `dash-card dash-card--md`；bem: `ui-card ui-card--pad-md`
 */
export function buildCardClassName(opts: {
  padding?: CardPadding
  className?: ClassValue
  mode?: 'pc' | 'bem'
  prefix?: string
} = {}): string {
  const padding = opts.padding || 'md'
  const mode = opts.mode || 'pc'
  if (mode === 'bem') {
    const prefix = opts.prefix || 'ui-card'
    return cx(prefix, `${prefix}--pad-${padding}`, opts.className)
  }
  const prefix = opts.prefix || 'dash-card'
  return cx(prefix, `${prefix}--${padding}`, opts.className)
}

export function buildCardHeaderClassName(opts: {
  className?: ClassValue
  mode?: 'pc' | 'bem'
  prefix?: string
} = {}): string {
  const mode = opts.mode || 'pc'
  const prefix = opts.prefix || (mode === 'bem' ? 'ui-card__header' : 'card-header')
  return cx(prefix, opts.className)
}

export function buildCardContentClassName(opts: {
  className?: ClassValue
  mode?: 'pc' | 'bem'
  prefix?: string
} = {}): string {
  const mode = opts.mode || 'pc'
  const prefix = opts.prefix || (mode === 'bem' ? 'ui-card__content' : 'card-content')
  return cx(prefix, opts.className)
}
