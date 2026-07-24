/**
 * 记一笔 / 模板执行 — 表单字段 → API payload 纯函数
 * 不依赖 shared-types，形状对齐 CreateTransactionInput（可含扩展字段）
 */

import { parseAmount } from './budget'

export type TransactionType = 'expense' | 'income'

export type TransactionLocationInput = {
  name?: string | null
  /** PC LocationResult 字段 */
  locationName?: string | null
  latitude?: number | null
  longitude?: number | null
  poiId?: string | null
  poi_id?: string | null
} | null

export type BuildTransactionPayloadInput = {
  type: TransactionType
  amount: string | number
  /** 分类 id */
  categoryId: string | number
  date: string
  brand?: string
  note?: string
  location?: TransactionLocationInput
  /** 已保存图片 URL 列表；编辑时常带上 */
  savedImages?: string[]
  /** 是否把 savedImages 写入 image_urls（编辑 true，新建通常 false） */
  withSavedImages?: boolean
  /** 已序列化的 image_urls，优先于 savedImages */
  imageUrlsJson?: string
}

export type TransactionPayload = {
  type: TransactionType
  amount: number
  category: string
  date: string
  brand?: string
  description?: string
  latitude?: number
  longitude?: number
  location_name?: string
  poi_id?: string
  image_urls?: string
}

function resolveLocationName(location?: TransactionLocationInput): string | undefined {
  if (!location) return undefined
  const name = location.locationName || location.name
  return name || undefined
}

function resolvePoiId(location?: TransactionLocationInput): string | undefined {
  if (!location) return undefined
  return location.poi_id || location.poiId || undefined
}

function resolveCoord(value?: number | null): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** 表单 → 创建/更新交易 payload */
export function buildTransactionPayload(input: BuildTransactionPayloadInput): TransactionPayload {
  const payload: TransactionPayload = {
    type: input.type,
    amount: parseAmount(input.amount),
    category: String(input.categoryId),
    date: input.date,
    brand: input.brand || undefined,
    description: input.note || undefined,
    latitude: resolveCoord(input.location?.latitude),
    longitude: resolveCoord(input.location?.longitude),
    location_name: resolveLocationName(input.location),
  }

  const poiId = resolvePoiId(input.location)
  if (poiId) payload.poi_id = poiId

  if (input.imageUrlsJson) {
    payload.image_urls = input.imageUrlsJson
  } else if (
    input.withSavedImages &&
    input.savedImages &&
    input.savedImages.length > 0
  ) {
    payload.image_urls = JSON.stringify(input.savedImages)
  }

  return payload
}
