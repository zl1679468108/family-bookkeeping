/** 实体名称（列表/toast/标题复用） */

export const ENTITY_CATEGORY = '分类'
export const ENTITY_TEMPLATE = '模板'
export const ENTITY_BOOK = '账本'
export const ENTITY_TRANSACTION = '交易'
export const ENTITY_BUDGET = '预算'

/** 实体新建/编辑标题与按钮文案 */

export function entityCreateTitle(entity: string, verb = '新建'): string {
  return `${verb}${entity}`
}

export function entityEditTitle(entity: string): string {
  return `编辑${entity}`
}

/** 弹窗/页标题：编辑模板 / 新建模板 */
export function entityFormTitle(entity: string, isEdit: boolean, createVerb = '新建'): string {
  return isEdit ? entityEditTitle(entity) : entityCreateTitle(entity, createVerb)
}

/** 列表主操作：+ 新建分类 */
export function entityCreateButton(entity: string, plus = '+'): string {
  return `${plus} 新建${entity}`
}

/** 详情弹窗标题：分类详情 / 模板详情 */
export function entityDetailTitle(entity: string): string {
  return `${entity}详情`
}

export const DETAIL_CATEGORY = entityDetailTitle(ENTITY_CATEGORY)
export const DETAIL_TEMPLATE = entityDetailTitle(ENTITY_TEMPLATE)
export const DETAIL_BOOK = entityDetailTitle(ENTITY_BOOK)
export const DETAIL_TRANSACTION = entityDetailTitle(ENTITY_TRANSACTION)
export const DETAIL_BUDGET = entityDetailTitle(ENTITY_BUDGET)

/** 编辑预算 - 餐饮 */
export function entityEditNamedTitle(entity: string, name?: string | null): string {
  const base = entityEditTitle(entity)
  const n = String(name || '').trim()
  return n ? `${base} - ${n}` : base
}

/** 删除预算 / 删除分类 */
export function entityDeleteAction(entity: string): string {
  return `删除${entity}`
}

export const ACTION_EDIT_BUDGET = entityEditTitle(ENTITY_BUDGET)
export const ACTION_DELETE_BUDGET = entityDeleteAction(ENTITY_BUDGET)

/** 系统预置默认账本名称（不可删） */
export const DEFAULT_BOOK_NAME = '默认账本'


/** 删除确认等场景的账本名回退 */
export const ENTITY_BOOK_FALLBACK = '该账本'

/** 通用空值展示 */
export const LABEL_NONE = '无'

/** 通用未知展示（用户名等） */
export const LABEL_UNKNOWN = '未知'

/** 账本状态：已归档 */
export const LABEL_ARCHIVED = '已归档'

/** 年报等未选账本 */
export const EMPTY_BOOK_UNSELECTED = '未选择账本'

/** N 笔 */
export function transactionCountLabel(count: number): string {
  return `${Number(count) || 0} 笔`
}

/** 共 N 笔 */
export function totalTransactionCountLabel(count: number): string {
  return `共 ${Number(count) || 0} 笔`
}

/** 光顾 N 次 */
export function visitCountLabel(count: number): string {
  return `光顾 ${Number(count) || 0} 次`
}

/** 当日支出 {amountText} */
export function dayExpenseAmountLabel(amountText: string): string {
  return `当日支出 ${amountText}`
}
