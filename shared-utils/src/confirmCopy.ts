import { ACTION_DELETING } from './actionCopy'

/** 删除 / 移除 / 预算复制 确认弹窗文案（PC + 与 Taro 对齐） */

export const CONFIRM_DELETE_TITLE = '确认删除'
export const CONFIRM_DELETE_BOOK_TITLE = '删除账本'
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

/** Admin：修改用户角色/状态 */
export const CONFIRM_UPDATE_ROLE_TITLE = '修改用户角色'
export const CONFIRM_UPDATE_STATUS_TITLE = '修改用户状态'
export const CONFIRM_UPDATE_TEXT = '确认修改'

/** 切换账本影响说明 */
export const SWITCH_BOOK_IMPACT_PREFIX = '切换到账本 '
export const SWITCH_BOOK_IMPACT_SUFFIX = ' 后，以下模块数据将切换为该账本的维度：'

export type SwitchBookImpactItem = { label: string; desc: string }

/** PC 端影响模块列表（含日历/地图/年报/导出等） */
export const SWITCH_BOOK_IMPACT_PC: SwitchBookImpactItem[] = [
  { label: '首页', desc: '收支概览与预算进度' },
  { label: '流水', desc: '交易记录列表' },
  { label: '报表', desc: '统计图表与分类分析' },
  { label: '日历', desc: '日历视图中的交易' },
  { label: '地图', desc: '交易位置与商户聚合' },
  { label: '模板', desc: '快捷记账模板' },
  { label: '预算', desc: '预算设置与消耗' },
  { label: '年报', desc: '年度报告数据' },
  { label: '导出', desc: '账单导出' },
]

/** 小程序影响模块列表（Tab 信息架构） */
export const SWITCH_BOOK_IMPACT_TARO: SwitchBookImpactItem[] = [
  { label: '首页', desc: '收支概览与预算进度' },
  { label: '流水', desc: '交易记录列表' },
  { label: '工作台', desc: '账本 / 分类 / 模板 / 预算' },
  { label: '我的', desc: '个人设置与账本入口' },
]

/** 当前账本：{name} */
export function currentBookLabel(name: string): string {
  return `当前账本：${name || ''}`
}

