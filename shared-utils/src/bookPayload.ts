/**
 * 账本创建/更新 — 表单字段 → API payload 纯函数
 */

import { FORM_NAME_REQUIRED } from './formCopy'

export type BookFormFields = {
  name: string
  description?: string
  /** 内置 key / 自定义 URL / 自定义 icon uuid */
  icon?: string
  icon_id?: string
}

export type BookPayload = {
  name: string
  description?: string
  icon?: string
  icon_id?: string
}

/** 自定义图标 id：uuid 形态（含 - 且长度 36） */
export function isCustomBookIconId(iconKey?: string | null): boolean {
  if (!iconKey) return false
  return iconKey.length === 36 && iconKey.includes('-')
}

/** 自定义上传 URL */
export function isCustomBookIconUrl(iconKey?: string | null): boolean {
  if (!iconKey) return false
  return (
    iconKey.startsWith('http://') ||
    iconKey.startsWith('https://') ||
    iconKey.startsWith('//')
  )
}

export function validateBookName(name: string, message = FORM_NAME_REQUIRED): string | null {
  if (!String(name ?? '').trim()) return message
  return null
}

/**
 * 构建创建/更新账本 payload。
 * - 自定义 uuid → icon_id
 * - URL / 内置 key → icon
 */
export function buildBookPayload(input: BookFormFields): BookPayload {
  const name = String(input.name ?? '').trim()
  const description = String(input.description ?? '').trim()
  const payload: BookPayload = { name }
  if (description) payload.description = description

  const iconKey = input.icon_id || input.icon || ''
  if (iconKey) {
    if (isCustomBookIconId(iconKey)) payload.icon_id = iconKey
    else payload.icon = iconKey
  }
  return payload
}
