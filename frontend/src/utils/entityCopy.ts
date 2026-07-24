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
