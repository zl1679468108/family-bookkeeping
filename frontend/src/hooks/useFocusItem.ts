import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const FOCUS_PARAM = 'focus'
const HIGHLIGHT_CLASS = 'spotlight--focused'
const HIGHLIGHT_DURATION = 3000
const POLL_INTERVAL = 80
const MAX_POLL = 40 // 最多等 40 * 80ms = 3.2 秒

interface UseFocusItemOptions {
  /** 聚焦匹配属性的名称，默认 'data-focus' */
  dataAttribute?: string
  /** 自定义选择器函数（高级用法） */
  getTargetSelector?: (focusId: string) => string | null
  /** 高亮持续时间（ms），默认 3000 */
  duration?: number
  /** 滚动行为，默认 'smooth' */
  scrollBehavior?: ScrollBehavior
  /** 滚动对齐方式，默认 'center' */
  scrollBlock?: ScrollLogicalPosition
}

export function useFocusItem(options: UseFocusItemOptions = {}) {
  const {
    dataAttribute = 'data-focus',
    getTargetSelector,
    duration = HIGHLIGHT_DURATION,
    scrollBehavior = 'smooth',
    scrollBlock = 'center',
  } = options

  const [searchParams, setSearchParams] = useSearchParams()
  const focusId = searchParams.get(FOCUS_PARAM)

  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const appliedElementRef = useRef<HTMLElement | null>(null)

  /** 清理所有高亮状态 */
  const clearAll = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (appliedElementRef.current) {
      appliedElementRef.current.classList.remove(HIGHLIGHT_CLASS)
      appliedElementRef.current = null
    }
  }, [])

  /** 将 focusId 转为选择器 */
  const getSelector = useCallback(
    (id: string): string | null => {
      if (getTargetSelector) return getTargetSelector(id)
      return `[${dataAttribute}="${id}"]`
    },
    [dataAttribute, getTargetSelector],
  )

  useEffect(() => {
    // focusId 为空：不做任何事，允许下次变化时重新触发
    if (!focusId) return

    const selector = getSelector(focusId)
    if (!selector) return

    // 先清理旧的，避免同时高亮两个元素
    clearAll()

    /** 查找目标并触发高亮 */
    const tryApply = (): boolean => {
      const target = document.querySelector(selector) as HTMLElement | null
      if (!target) return false

      // 滚动到目标
      target.scrollIntoView({ behavior: scrollBehavior, block: scrollBlock })
      // 添加高亮 class
      target.classList.add(HIGHLIGHT_CLASS)
      appliedElementRef.current = target

      // 定时移除高亮 + 删除 URL 参数
      cleanupTimerRef.current = setTimeout(() => {
        target.classList.remove(HIGHLIGHT_CLASS)
        if (appliedElementRef.current === target) {
          appliedElementRef.current = null
        }
        const newParams = new URLSearchParams(searchParams)
        newParams.delete(FOCUS_PARAM)
        setSearchParams(newParams, { replace: true })
      }, duration)

      return true
    }

    // 先立即尝试一次
    if (tryApply()) return

    // 没找到，轮询等待元素渲染完成
    let count = 0
    pollTimerRef.current = setInterval(() => {
      count += 1
      if (tryApply()) {
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
        }
        return
      }
      if (count >= MAX_POLL && pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }, POLL_INTERVAL)

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [focusId, getSelector, clearAll, duration, scrollBehavior, scrollBlock, searchParams.toString(), setSearchParams])

  // 组件卸载时清理
  useEffect(() => {
    return () => clearAll()
  }, [clearAll])

  return {
    focusId,
    hasFocus: Boolean(focusId),
    HIGHLIGHT_CLASS,
  }
}
