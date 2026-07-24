/**
 * 详情金额 class — PC 流水详情
 */

import { cx, type ClassValue } from './cx'
import { isIncomeType } from './transactionType'

export function buildDetailAmountValueClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'detail-amount-value'
  return cx(prefix, isIncomeType(opts.type) && 'income', opts.className)
}
