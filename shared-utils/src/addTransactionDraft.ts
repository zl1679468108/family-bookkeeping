/**
 * 记一笔草稿 — 纯序列化 / 判定（端侧负责 sessionStorage / Taro Storage）
 */

export const ADD_TX_DRAFT_PREFIX = 'add-tx-draft:'

export type AddTransactionDraftForm = {
  amount: string
  category: string
  type: 'expense' | 'income'
  date: string
  brand: string
  note: string
}

export type AddTransactionDraftLocation = {
  locationName: string
  latitude: number
  longitude: number
  poiId: string | null
} | null

export type AddTransactionDraft = {
  formData: AddTransactionDraftForm
  location: AddTransactionDraftLocation
  updatedAt: number
}

/** 端侧位置形态兼容：PC locationName / Taro name */
export type DraftLocationInput = {
  locationName?: string | null
  name?: string | null
  latitude?: number | null
  longitude?: number | null
  poiId?: string | null
} | null | undefined

export function addTransactionDraftKey(bookId: string): string {
  return `${ADD_TX_DRAFT_PREFIX}${bookId}`
}

export function parseAddTransactionDraft(
  raw: string | null | undefined,
): AddTransactionDraft | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AddTransactionDraft
    if (!parsed?.formData || typeof parsed.formData !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function serializeAddTransactionDraft(
  draft: Omit<AddTransactionDraft, 'updatedAt'> & { updatedAt?: number },
  now = Date.now(),
): string {
  const payload: AddTransactionDraft = {
    formData: draft.formData,
    location: draft.location ?? null,
    updatedAt: draft.updatedAt ?? now,
  }
  return JSON.stringify(payload)
}

/** 从 storage 全部 key 中筛出记一笔草稿 key */
export function listAddTransactionDraftKeys(allKeys: readonly string[]): string[] {
  return allKeys.filter((k) => k.startsWith(ADD_TX_DRAFT_PREFIX))
}

/** 无金额/分类/品牌/备注/位置 → 视为空草稿（应清除） */
export function isAddTransactionDraftEmpty(
  form: Partial<AddTransactionDraftForm> | null | undefined,
  location?: AddTransactionDraftLocation | null,
): boolean {
  const f = form || {}
  return !f.amount && !f.category && !f.brand && !f.note && !location
}

/** 端侧 Location → 草稿 location（统一 locationName） */
export function toAddTransactionDraftLocation(
  loc: DraftLocationInput,
): AddTransactionDraftLocation {
  if (!loc) return null
  const name = String(loc.locationName ?? loc.name ?? '').trim()
  const lat = loc.latitude
  const lng = loc.longitude
  if (!name && (lat == null || lng == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng)))) {
    return null
  }
  return {
    locationName: name,
    latitude: Number(lat ?? 0),
    longitude: Number(lng ?? 0),
    poiId: loc.poiId ?? null,
  }
}

/** 恢复表单字段（新建模式） */
export function restoreAddTransactionFormData(
  draft: AddTransactionDraft | null | undefined,
  fallbackDate: string,
): AddTransactionDraftForm | null {
  if (!draft?.formData || typeof draft.formData !== 'object') return null
  const fd = draft.formData
  return {
    amount: fd.amount || '',
    category: fd.category || '',
    type: fd.type === 'income' ? 'income' : 'expense',
    date: fd.date || fallbackDate,
    brand: fd.brand || '',
    note: fd.note || '',
  }
}
