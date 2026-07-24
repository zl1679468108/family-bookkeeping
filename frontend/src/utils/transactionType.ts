/** 收支类型文案与选项 —— 列表/详情/表单共用 */

export type TransactionTypeCode = 'expense' | 'income'

export function transactionTypeLabel(
  type?: string | null,
  fallback = '',
): string {
  if (type === 'income') return '收入'
  if (type === 'expense') return '支出'
  return fallback || (type ?? '')
}

export function isExpenseType(type?: string | null): boolean {
  return type === 'expense'
}

export function isIncomeType(type?: string | null): boolean {
  return type === 'income'
}

/** Dropdown / SegControl 选项 */
export const TRANSACTION_TYPE_OPTIONS: ReadonlyArray<{
  key: TransactionTypeCode
  label: string
}> = [
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
]

/** 流水筛选：全部 + 支出 + 收入 */
export const TRANSACTION_TYPE_FILTER_LABELS = ['全部类型', '支出', '收入'] as const

/** Admin / 列表 status 徽标 class */
export function transactionTypeStatusClass(type?: string | null): string {
  return type === 'income' ? 'status status--success' : 'status status--danger'
}

/** 金额着色 class */
export function transactionTypeAmountClass(type?: string | null): string {
  return type === 'income' ? 'amount amount--income' : 'amount amount--expense'
}
