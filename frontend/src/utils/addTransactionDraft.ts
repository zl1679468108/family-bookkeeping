/**
 * 记一笔草稿 — PC sessionStorage 适配；纯序列化见 shared-utils
 */
import {
  addTransactionDraftKey,
  parseAddTransactionDraft,
  serializeAddTransactionDraft,
  listAddTransactionDraftKeys,
  isAddTransactionDraftEmpty,
  toAddTransactionDraftLocation,
  restoreAddTransactionFormData,
  type AddTransactionDraft,
  type AddTransactionDraftForm,
} from '../../../shared-utils/src/addTransactionDraft'

export type {
  AddTransactionDraft,
  AddTransactionDraftForm,
  AddTransactionDraftLocation,
  DraftLocationInput,
} from '../../../shared-utils/src/addTransactionDraft'

export {
  addTransactionDraftKey,
  parseAddTransactionDraft,
  serializeAddTransactionDraft,
  listAddTransactionDraftKeys,
  isAddTransactionDraftEmpty,
  toAddTransactionDraftLocation,
  restoreAddTransactionFormData,
}

export function loadAddTransactionDraft(bookId: string): AddTransactionDraft | null {
  if (!bookId || typeof sessionStorage === 'undefined') return null
  try {
    return parseAddTransactionDraft(sessionStorage.getItem(addTransactionDraftKey(bookId)))
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
    sessionStorage.setItem(
      addTransactionDraftKey(bookId),
      serializeAddTransactionDraft(draft),
    )
  } catch {
    // quota / private mode — ignore
  }
}

export function clearAddTransactionDraft(bookId?: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    if (bookId) {
      sessionStorage.removeItem(addTransactionDraftKey(bookId))
      return
    }
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key) keys.push(key)
    }
    listAddTransactionDraftKeys(keys).forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // ignore
  }
}
