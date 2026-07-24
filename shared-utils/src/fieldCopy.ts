/** 表单/详情字段标签 — 双端对齐 */

export const FIELD_NAME = '名称'
export const FIELD_TYPE = '类型'
export const FIELD_AMOUNT = '金额'
export const FIELD_CATEGORY = '分类'
export const FIELD_DATE = '日期'
export const FIELD_BRAND = '品牌'
export const FIELD_NOTE = '备注'
export const FIELD_LOCATION = '位置'
export const FIELD_FREQUENCY = '频率'
export const FIELD_SORT = '排序'
export const FIELD_START_DATE = '开始日期'

/** 排序展示：第 N 位（sort_order 从 0 起） */
export function sortOrderLabel(sortOrder: number): string {
  return `第 ${Number(sortOrder) + 1} 位`
}
export const FIELD_MERCHANT = '商户'
export const FIELD_CYCLE = '周期'
export const FIELD_END_DATE = '结束日期'
export const FIELD_LAST_EXECUTED = '上次执行'
export const FIELD_NEXT_EXECUTED = '下次执行'
export const FIELD_CREATED_AT = '创建时间'
export const FIELD_UPDATED_AT = '更新时间'
export const FIELD_TEMPLATE = '模板'
export const FIELD_CATEGORY_ID = '分类 ID'
export const FIELD_TEMPLATE_NAME = '模板名称'
export const FIELD_LOCATION_INFO = '位置信息'
