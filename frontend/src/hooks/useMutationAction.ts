import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDebouncedAction } from './useDebouncedAction'
import { notifySuccess, notifyError } from '../utils/notifyError'

export interface MutationActionOptions<T extends any[] = any[], R = unknown> {
  /** 成功后失效的 query key（支持 as const / 工厂返回的只读元组） */
  invalidateKeys?: readonly QueryKey[]
  onSuccess?: (result: R, ...args: T) => void
  onError?: (err: unknown, ...args: T) => void
  /** 字符串，或按结果返回文案；返回 null/undefined 则不 toast */
  successMessage?: string | ((result: R, ...args: T) => string | null | undefined)
  errorMessage?: string
  /**
   * 返回 false 时跳过 invalidate 与成功 toast（仍会执行 onSuccess）。
   * 用于「业务上成功但无需刷新」或「校验后主动中止提交结果」。
   */
  shouldCommit?: (result: R, ...args: T) => boolean
}

/**
 * 统一 mutation 操作 hook
 *
 * 内部组合 useDebouncedAction（防抖锁 + isRunning）和 useQueryClient（缓存失效），
 * 替代分散的 useMutation + useDebouncedAction 模式。
 *
 * @example
 * const { run, isRunning } = useMutationAction(
 *   (data) => createTemplate(data),
 *   { invalidateKeys: [queryKeys.templates.all], successMessage: '模板已创建' }
 * )
 */
export function useMutationAction<T extends any[], R>(
  mutationFn: (...args: T) => Promise<R>,
  options: MutationActionOptions<T, R> = {},
) {
  const qc = useQueryClient()
  const { invalidateKeys, onSuccess, onError, successMessage, errorMessage, shouldCommit } = options

  const { run, isRunning } = useDebouncedAction(async (...args: T) => {
    try {
      const result = await mutationFn(...args)
      const commit = shouldCommit ? shouldCommit(result, ...args) : true
      if (commit) {
        invalidateKeys?.forEach((key) => qc.invalidateQueries({ queryKey: key }))
        const msg =
          typeof successMessage === 'function' ? successMessage(result, ...args) : successMessage
        if (msg) notifySuccess(msg)
      }
      onSuccess?.(result, ...args)
      return result
    } catch (err: unknown) {
      onError?.(err, ...args)
      if (errorMessage) notifyError(err, errorMessage)
      throw err
    }
  })

  return useMemo(
    () => ({
      run,
      isRunning,
      isPending: isRunning,
      mutate: run,
      mutateAsync: run,
    }),
    [run, isRunning],
  )
}
