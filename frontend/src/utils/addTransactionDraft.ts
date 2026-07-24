import type { LocationResult } from '@family-bookkeeping/shared-types'

export interface AddTransactionDraftForm {
  amount: string
  category: string
  type: 'expense' | 'income'
  date: string
  brand: string
  note: string
}

export interface AddTransactionDraft {
  formData: AddTransactionDraftForm
  location: LocationResult | null
  updatedAt: number
}

const draftKey = (bookId: string) => `add-tx-draft:${bookId}`

export function loadAddTransactionDraft(bookId: string): AddTransactionDraft | null {
  if (!bookId || typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(draftKey(bookId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AddTransactionDraft
    if (!parsed?.formData || typeof parsed.formData !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function saveAddTransactionDraft(
  bookId: string,
  draft: Omit<AddTransactionDraft, 'updatedAt'>,
): void {
  if (!bookId || typeof sessionStorage === 'undefined') return
  try {
    const payload: AddTransactionDraft = { ...draft, updatedAt: Date.now() }
    sessionStorage.setItem(draftKey(bookId), JSON.stringify(payload))
  } catch {
    // quota / private mode — ignore
  }
}

export function clearAddTransactionDraft(bookId?: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    if (bookId) {
      sessionStorage.removeItem(draftKey(bookId))
      return
    }
    // 无 bookId 时清掉所有记一笔草稿
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key?.startsWith('add-tx-draft:')) keys.push(key)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // ignore
  }
}
