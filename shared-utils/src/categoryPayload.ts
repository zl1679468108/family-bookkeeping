/**
 * 分类创建/更新 — 表单字段 → API payload 纯函数
 * 与 bookPayload 对齐：自定义 uuid → icon_id，URL/emoji/内置 key → icon
 */

import { FORM_NAME_REQUIRED } from './formCopy'
import { isCustomBookIconId } from './bookPayload'

export type CategoryType = 'expense' | 'income'

export type CategoryFormFields = {
  name: string
  /** emoji / platform key / 自定义 URL / 自定义 icon uuid */
  icon?: string
  type?: CategoryType
}

export type CategoryPayload = {
  name: string
  icon?: string
  icon_id?: string
  type?: CategoryType
}

/** 复用账本侧的自定义图标 id 判定（uuid 形态） */
export const isCustomCategoryIconId = isCustomBookIconId

export function validateCategoryName(
  name: string,
  message = FORM_NAME_REQUIRED,
): string | null {
  if (!String(name ?? '').trim()) return message
  return null
}

/**
 * 构建分类创建/更新 payload。
 * - includeType=true 时写入 type（创建）
 * - 自定义 uuid → icon_id
 * - 其余（emoji / platform_* / URL）→ icon
 */
export function buildCategoryPayload(
  input: CategoryFormFields,
  options?: { includeType?: boolean },
): CategoryPayload {
  const name = String(input.name ?? '').trim()
  const payload: CategoryPayload = { name }

  if (options?.includeType && input.type) {
    payload.type = input.type
  }

  const iconKey = String(input.icon ?? '').trim()
  if (iconKey) {
    if (isCustomBookIconId(iconKey)) payload.icon_id = iconKey
    else payload.icon = iconKey
  }

  return payload
}
