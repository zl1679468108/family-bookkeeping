import { useRef, useCallback, useMemo } from 'react'

/**
 * 异步操作防抖 hook —— 防止按钮重复点击导致重复调用 API
 *
 * 工作机制：使用 ref 作为"进行中"锁。在异步操作执行期间，
 * 后续的点击都会被忽略，直到上一次调用 resolve / reject。
 *
 * 与传统的基于时间的 debounce 相比，这种机制更适合按钮点击场景：
 * - 第一次点击立即执行（无延迟）
 * - 在操作完成前，后续点击均被忽略（无论多快）
 * - 操作完成后自动解锁，可以再次点击
 *
 * @param fn 需要防抖的异步函数
 * @returns 包装后的函数，以及当前是否正在执行的标志
 *
 * 示例：
 * ```ts
 * const { run: handleSubmit, isRunning: submitting } = useDebouncedAction(
 *   async (data) => { await createItem(data) }
 * )
 * // <button onClick={() => handleSubmit(data)} disabled={submitting}>
 * ```
 */
export function useDebouncedAction<T extends any[], R>(
  fn: (...args: T) => Promise<R> | R,
) {
  const isRunningRef = useRef(false)

  const run = useCallback(
    async (...args: T): Promise<R | undefined> => {
      if (isRunningRef.current) {
        return undefined
      }
      isRunningRef.current = true
      try {
        const result = await fn(...args)
        return result
      } finally {
        isRunningRef.current = false
      }
    },
    [fn],
  )

  const isRunning = useMemo(() => isRunningRef.current, [])

  return { run, isRunning }
}
