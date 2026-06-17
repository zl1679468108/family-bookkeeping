/**
 * Transactions API service.
 */

import {
  apiGet, apiPost, apiPut, apiDelete,
  API_BASE_URL, getToken, getStoredBookId,
} from "./api";
import Taro from "@tarojs/taro";

import type {
  Transaction,
  TransactionFilters,
  CreateTransactionInput,
  PaginatedResponse,
} from "../types";

export const getTransactions = (
  filters?: TransactionFilters,
): Promise<PaginatedResponse<Transaction>> => {
  const parts: string[] = [];
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
        );
      }
    });
  }
  const query = parts.join("&");
  return apiGet<PaginatedResponse<Transaction>>(
    `/transactions${query ? "?" + query : ""}`,
    { requiresAuth: true },
  );
};

export const getTransaction = (id: number): Promise<Transaction> =>
  apiGet<Transaction>(`/transactions/${id}`, { requiresAuth: true });

export const createTransaction = (
  input: CreateTransactionInput,
): Promise<Transaction> =>
  apiPost<Transaction>("/transactions", { data: input, requiresAuth: true });

export const updateTransaction = (
  id: number,
  input: Partial<CreateTransactionInput>,
): Promise<Transaction> =>
  apiPut<Transaction>(`/transactions/${id}`, { data: input, requiresAuth: true });

export const deleteTransaction = (id: number): Promise<void> =>
  apiDelete<void>(`/transactions/${id}`, { requiresAuth: true });

// ---- Receipt (Image Upload) ----

/** Upload a receipt image for a transaction */
export const uploadReceipt = (
  transactionId: number,
  filePath: string,
): Promise<{ image_url: string }> => {
  const token = getToken();
  const bookId = getStoredBookId();
  const header: Record<string, string> = {};
  if (token) header["Authorization"] = `Bearer ${token}`;
  if (bookId) header["x-book-id"] = bookId;

  return Taro.uploadFile({
    url: `${API_BASE_URL}/transactions/${transactionId}/receipt`,
    filePath,
    name: "file",
    header,
  }).then((res) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      try {
        const payload = JSON.parse(res.data);
        if (payload && payload.data && payload.data.image_url) {
          return { image_url: payload.data.image_url };
        }
        if (payload && payload.image_url) {
          return { image_url: payload.image_url };
        }
        return JSON.parse(res.data);
      } catch {
        return { image_url: "" };
      }
    }
    throw new Error("上传失败");
  });
};

/** Delete receipt image for a transaction */
export const deleteReceipt = (transactionId: number): Promise<void> => {
  return apiDelete<void>(`/transactions/${transactionId}/receipt`, {
    requiresAuth: true,
  });
};
