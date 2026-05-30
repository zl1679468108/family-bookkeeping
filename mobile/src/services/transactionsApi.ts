/**
 * Transactions API service.
 */

import apiClient from './api';
import type {
  Transaction,
  CreateTransactionInput,
  TransactionFilters,
  PaginatedResponse,
} from '../types';

const TRANSACTIONS_PATH = '/transactions';

/** Get paginated transaction list */
export const getTransactions = async (
  filters?: TransactionFilters,
): Promise<PaginatedResponse<Transaction>> => {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters?.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const { data } = await apiClient.get<PaginatedResponse<Transaction>>(
    `${TRANSACTIONS_PATH}${query}`,
  );
  return data;
};

/** Get single transaction */
export const getTransaction = async (id: number): Promise<Transaction> => {
  const { data } = await apiClient.get<Transaction>(`${TRANSACTIONS_PATH}/${id}`);
  return data;
};

/** Create transaction */
export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<Transaction> => {
  const { data } = await apiClient.post<Transaction>(TRANSACTIONS_PATH, input);
  return data;
};

/** Update transaction */
export const updateTransaction = async (
  id: number,
  input: Partial<CreateTransactionInput>,
): Promise<Transaction> => {
  const { data } = await apiClient.put<Transaction>(
    `${TRANSACTIONS_PATH}/${id}`,
    input,
  );
  return data;
};

/** Delete transaction */
export const deleteTransaction = async (id: number): Promise<void> => {
  await apiClient.delete(`${TRANSACTIONS_PATH}/${id}`);
};
