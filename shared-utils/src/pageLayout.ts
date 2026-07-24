/**
 * PageLayout class — Taro 页面壳
 */

import { cx, type ClassValue } from './cx'

export function buildPageLayoutClassName(opts: {
  themeClass?: string
  className?: ClassValue
  prefix?: string
  base?: string
} = {}): string {
  const base = opts.base || 'min-h-screen bg-bg flex flex-col page-layout'
  return cx(base, opts.themeClass, opts.className)
}

export function buildPageLayoutContentClassName(opts: {
  className?: ClassValue
  extra?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'page-layout-content'
  return cx(prefix, opts.extra, opts.className)
}

export function buildPageLayoutInnerClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'page-layout-inner'
  return cx(prefix, opts.className)
}
