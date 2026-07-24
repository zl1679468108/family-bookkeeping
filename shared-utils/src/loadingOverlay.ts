/**
 * LoadingOverlay class — Taro 列表加载遮罩
 */

import { cx, type ClassValue } from './cx'

export function buildLoadingOverlayClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-loading-overlay'
  return cx(prefix, opts.className)
}
