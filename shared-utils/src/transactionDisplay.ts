/**
 * 交易展示 class 修饰 — 金额/图标收支色
 */

import { cx, type ClassValue } from './cx'
import { isExpenseType } from './transactionType'

/** PC 表格/列表金额：debit / credit */
export function buildTxnAmountClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
  expenseClass?: string
  incomeClass?: string
} = {}): string {
  const prefix = opts.prefix || 'cell-amount'
  const expenseClass = opts.expenseClass || 'debit'
  const incomeClass = opts.incomeClass || 'credit'
  const tone = isExpenseType(opts.type) ? expenseClass : incomeClass
  return cx(prefix, tone, opts.className)
}

/** Taro 交易行金额：txi-amount--expense/income */
export function buildTxiAmountClassName(opts: {
  type?: string | null
  isExpense?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'txi-amount'
  const expense = opts.isExpense ?? isExpenseType(opts.type)
  return cx(prefix, expense ? `${prefix}--expense` : `${prefix}--income`, opts.className)
}

export function buildTxiIconClassName(opts: {
  type?: string | null
  isExpense?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'txi-icon'
  const expense = opts.isExpense ?? isExpenseType(opts.type)
  return cx(prefix, expense ? `${prefix}--expense` : `${prefix}--income`, opts.className)
}

export function buildTxiMainClassName(opts: {
  swiped?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'txi-main'
  return cx(prefix, opts.swiped && `${prefix}--swiped`, opts.className)
}

export function buildTxiDeleteClassName(opts: {
  show?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'txi-delete'
  return cx(prefix, opts.show && `${prefix}--show`, opts.className)
}

/** 首页流水金额/图标 */
export function buildHomeTxnAmountClassName(opts: {
  isExpense?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'home-txn-amt'
  return cx(prefix, opts.isExpense ? `${prefix}--exp` : `${prefix}--inc`, opts.className)
}

export function buildHomeTxnIconClassName(opts: {
  isExpense?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'home-txn-icon'
  return cx(prefix, opts.isExpense ? `${prefix}--exp` : `${prefix}--inc`, opts.className)
}
