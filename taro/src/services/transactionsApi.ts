/**
 * Transactions API service.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
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
  );
};

export const getTransaction = (id: number): Promise<Transaction> =>
  apiGet<Transaction>(`/transactions/${id}`);

export const createTransaction = (
  input: CreateTransactionInput,
): Promise<Transaction> => apiPost<Transaction>("/transactions", input);

export const updateTransaction = (
  id: number,
  input: Partial<CreateTransactionInput>,
): Promise<Transaction> => apiPut<Transaction>(`/transactions/${id}`, input);

export const deleteTransaction = (id: number): Promise<void> =>
  apiDelete<void>(`/transactions/${id}`);
