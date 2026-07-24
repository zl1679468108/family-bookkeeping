/**
 * PageHero class — Taro 页顶重点信息区
 */

import { cx, type ClassValue } from './cx'

export type PageHeroTone = 'primary' | 'surface'

export function buildPageHeroClassName(opts: {
  tone?: PageHeroTone
  className?: ClassValue
  prefix?: string
} = {}): string {
  const tone = opts.tone || 'primary'
  const prefix = opts.prefix || 'page-hero'
  return cx(prefix, `${prefix}--${tone}`, opts.className)
}
