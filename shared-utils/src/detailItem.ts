/**
 * DetailItem class — PC 详情行
 */

import { cx, type ClassValue } from './cx'

export function buildDetailItemClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'detail-item'
  return cx(prefix, opts.className)
}
