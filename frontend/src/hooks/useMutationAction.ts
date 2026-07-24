import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDebouncedAction } from './useDebouncedAction'
import { notifySuccess, notifyError } from '../utils/notifyError'

export interface MutationActionOptions {
  invalidateKeys?: (string | number)[][]
  onSuccess?: () => void
  onError?: (err: any) => void
  successMessage?: string
  errorMessage?: string
}

/**
 * 统一 mutation 操作 hook
 *
 * 内部组合 useDebouncedAction（防抖锁 + isRunning）和 useQueryClient（缓存失效），
 * 替代分散的 useMutation + useDebouncedAction 模式。
 *
 * @example
 * const { run, isRunning, isPending } = useMutationAction(
 *   (data) => createTemplate(data),
 *   { invalidateKeys: [['templates']], successMessage: '模板已创建' }
 * )
 * // <button onClick={() => run(data)} disabled={isRunning}>保存</button>
 */
export function useMutationAction<T extends any[], R>(
  mutationFn: (...args: T) => Promise<R>,
  options: MutationActionOptions = {},
) {
  const qc = useQueryClient()
  const { invalidateKeys, onSuccess, onError, successMessage, errorMessage } = options

  const { run, isRunning } = useDebouncedAction(async (...args: T) => {
    try {
      const result = await mutationFn(...args)
      invalidateKeys?.forEach((key) => qc.invalidateQueries({ queryKey: key }))
      onSuccess?.()
      if (successMessage) notifySuccess(successMessage)
      return result
    } catch (err: any) {
      onError?.(err)
      if (errorMessage) notifyError(err, errorMessage)
      throw err
    }
  })

  return useMemo(() => ({
    run,
    isRunning,
    isPending: isRunning,
    mutate: run,
    mutateAsync: run,
  }), [run, isRunning])
}
