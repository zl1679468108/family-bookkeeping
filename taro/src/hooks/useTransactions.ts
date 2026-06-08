/**
 * Hook: transaction list queries and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionsApi";
import type { TransactionFilters, CreateTransactionInput } from "../types";

/** Fetch paginated transactions */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
    staleTime: 30 * 1000,
  });
}

/** Create transaction mutation */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

/** Update transaction mutation */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: Partial<CreateTransactionInput>;
    }) => updateTransaction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
}

/** Delete transaction mutation */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}
