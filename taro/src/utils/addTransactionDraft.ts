/**
 * 记一笔草稿 — Taro Storage 适配；纯序列化见 shared-utils
 */
import Taro from "@tarojs/taro";
import {
  addTransactionDraftKey,
  parseAddTransactionDraft,
  serializeAddTransactionDraft,
  listAddTransactionDraftKeys,
  isAddTransactionDraftEmpty,
  toAddTransactionDraftLocation,
  restoreAddTransactionFormData,
  type AddTransactionDraft,
} from "../../../shared-utils/src/addTransactionDraft";

export type {
  AddTransactionDraft,
  AddTransactionDraftForm,
  AddTransactionDraftLocation,
  DraftLocationInput,
} from "../../../shared-utils/src/addTransactionDraft";

export {
  addTransactionDraftKey,
  parseAddTransactionDraft,
  serializeAddTransactionDraft,
  listAddTransactionDraftKeys,
  isAddTransactionDraftEmpty,
  toAddTransactionDraftLocation,
  restoreAddTransactionFormData,
};

export function loadAddTransactionDraft(bookId: string): AddTransactionDraft | null {
  if (!bookId) return null;
  try {
    const raw = Taro.getStorageSync(addTransactionDraftKey(bookId));
    return parseAddTransactionDraft(typeof raw === "string" ? raw : raw ? String(raw) : null);
  } catch {
    return null;
  }
}

export function saveAddTransactionDraft(
  bookId: string,
  draft: Omit<AddTransactionDraft, "updatedAt">,
): void {
  if (!bookId) return;
  try {
    Taro.setStorageSync(addTransactionDraftKey(bookId), serializeAddTransactionDraft(draft));
  } catch {
    // quota — ignore
  }
}

export function clearAddTransactionDraft(bookId?: string): void {
  try {
    if (bookId) {
      Taro.removeStorageSync(addTransactionDraftKey(bookId));
      return;
    }
    const info = Taro.getStorageInfoSync();
    const keys = info?.keys || [];
    listAddTransactionDraftKeys(keys).forEach((k) => {
      try {
        Taro.removeStorageSync(k);
      } catch {
        // ignore single key
      }
    });
  } catch {
    // ignore
  }
}
