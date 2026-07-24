import { ACTION_DELETING } from './actionCopy'

/** 删除 / 移除 / 预算复制 确认弹窗文案（PC + 与 Taro 对齐） */

export const CONFIRM_DELETE_TITLE = '确认删除'
export const CONFIRM_DELETE_TEXT = '确认删除'
export const CONFIRM_DELETE_LOADING = ACTION_DELETING

export const CONFIRM_REMOVE_TITLE = '确认移除'
export const CONFIRM_REMOVE_TEXT = '确认移除'

/** 确定要删除这个{entity}吗？ */
export function confirmDeleteThis(entity: string): string {
  return `确定要删除这个${entity}吗？`
}

/** 确定要删除这笔交易吗？ */
export const CONFIRM_DELETE_TRANSACTION = '确定要删除这笔交易吗？'

/** 确定删除自定义分类「name」吗？删除后不可恢复。 */
export function confirmDeleteCategory(name: string): string {
  return `确定删除自定义分类「${name}」吗？删除后不可恢复。`
}

/** 确定删除「name」本月预算吗？删除后该分类预算将清零。 */
export function confirmDeleteBudget(categoryName: string): string {
  return `确定删除「${categoryName}」本月预算吗？删除后该分类预算将清零。`
}

/** 确定要删除「name」吗？此操作不可恢复，所有数据将被永久删除。 */
export function confirmDeleteBook(name: string): string {
  return `确定要删除「${name}」吗？此操作不可恢复，所有数据将被永久删除。`
}

/** 无名称时的账本删除说明（设置页） */
export const CONFIRM_DELETE_BOOK_GENERIC =
  '确定要删除该账本吗？账本内所有交易记录将被清除，此操作不可恢复。'

/** 确定要移除成员「name」吗？ */
export function confirmRemoveMember(name: string): string {
  return `确定要移除成员「${name}」吗？`
}

export const CONFIRM_COPY_BUDGET_TITLE = '复制上月预算'
export const CONFIRM_COPY_BUDGET_MESSAGE =
  '将上月预算复制到当前月份（已有金额会被覆盖），是否继续？'
export const CONFIRM_COPY_BUDGET_TEXT = '确认复制'
