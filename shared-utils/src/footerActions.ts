/**
 * FooterActions class — 弹窗/表单底栏双端共用
 */

import { cx, type ClassValue } from './cx'

export type FooterActionsAlign = 'end' | 'stretch' | 'start'

export function buildFooterActionsClassName(opts: {
  align?: FooterActionsAlign
  className?: ClassValue
  prefix?: string
} = {}): string {
  const { align = 'end', className = '', prefix = 'ui-footer-actions' } = opts
  return cx(prefix, `${prefix}--${align}`, className)
}
