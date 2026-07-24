/**
 * PageProgressBar class — PC 顶部路由进度条
 */

import { cx, type ClassValue } from './cx'

export function buildPageProgressBarClassName(opts: {
  visible?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'page-progress-bar'
  return cx(prefix, opts.visible && `${prefix}--visible`, opts.className)
}
