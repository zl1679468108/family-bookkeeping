/**
 * ============================================================
 * 交易相关 Hooks — useMutation 使用示例
 * ============================================================
 *
 * 【什么是 useMutation？】
 * 用于"增删改"操作（POST/PUT/DELETE），与 useQuery（只读 GET）配对使用。
 *
 * 【核心概念】
 *   mutationFn  →  实际执行的异步函数（调 API）
 *   onSuccess   →  成功后自动执行的副作用（刷新缓存、跳转等）
 *   isPending   →  是否正在执行中（用来禁用按钮、显示 loading）
 *
 * 【与 useQuery 的关系】
 *   useQuery      负责"读"：从后端拿数据，自动缓存
 *   useMutation   负责"写"：提交数据到后端，成功后刷新 useQuery 的缓存
 *
 *   两者通过 queryClient.invalidateQueries() 联动：
 *   增删改成功 → invalidateQueries(["transactions"]) → useQuery 自动重新请求
 *
 * 【invalidateQueries 做了什么？】
 *   告诉 React Query："key 包含 'transactions' 的所有缓存都过期了，
 *   下次组件渲染时重新请求。"
 *   类似于浏览器里按 F5 刷新页面。
 *
 * 【注意】
 *   本项目的 useQuery 已替换为 useManualQuery，
 *   因此 invalidateQueries 实际上不会触发刷新。
 *   各页面需要在 mutation 的 onSuccess 中自行调用 refetch。
 * ============================================================
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionsApi";
import type { TransactionFilters, CreateTransactionInput } from "../types";

/** 获取交易列表（已被 useManualQuery 替代，保留仅作参考） */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => getTransactions(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * 创建交易 — useMutation 示例
 *
 * mutationFn: 调用 createTransaction API
 * onSuccess:  创建成功后刷新交易列表、统计、预算的缓存
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    // 核心：定义要执行的异步操作
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    // 成功后自动执行
    onSuccess: () => {
      // 让所有 queryKey 包含 "transactions" 的缓存失效，自动重新请求
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["statistics"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

/**
 * 更新交易 — useMutation 示例
 *
 * mutationFn 接收 { id, input } 两个参数
 */
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

/**
 * 删除交易 — useMutation 示例
 */
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

// useQuery 仍保留导入，因为 useTransactions 函数内部使用了它
import { useQuery } from "@tanstack/react-query";
