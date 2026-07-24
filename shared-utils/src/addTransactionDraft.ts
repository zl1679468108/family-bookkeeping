/**
 * 记一笔草稿 — 纯序列化（端侧负责 sessionStorage / Taro Storage）
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
