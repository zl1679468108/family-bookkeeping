import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

const FOCUS_PARAM = 'focus'
const HIGHLIGHT_CLASS = 'spotlight--focused'
const HIGHLIGHT_DURATION = 2500

interface UseFocusItemOptions {
  /**
   * 聚焦匹配属性的名称，默认 'data-focus'
   * 自动生成选择器 `[data-focus="${focusId}"]`
   * @example 'data-id' → `[data-id="${focusId}"]`
   */
  dataAttribute?: string
  /**
   * 自定义选择器函数（高级用法）
   * 当 dataAttribute 不够灵活时使用
   * @example (id) => `#item-${id}`
   */
  getTargetSelector?: (focusId: string) => string | null
  /** 高亮持续时间（ms），默认 2500 */
  duration?: number
  /** 滚动行为，默认 'smooth' */
  scrollBehavior?: ScrollBehavior
  /** 滚动对齐方式，默认 'center' */
  scrollBlock?: ScrollLogicalPosition
}

/**
 * 通用聚焦 Hook
 *
 * 最简单的用法（DOM 上加 data-focus="xxx"，URL 传 ?focus=xxx）：
 *   const { focusId, hasFocus } = useFocusItem()
 *
 * 自定义匹配属性：
 *   const { focusId, hasFocus } = useFocusItem({ dataAttribute: 'data-id' })
 *
 * 复杂选择器：
 *   const { focusId, hasFocus } = useFocusItem({
 *     getTargetSelector: (id) => id ? `#section-${id}` : null,
 *   })
 */
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasTriggeredRef = useRef(false)

  /** 将 focusId 转换为 DOM 选择器 */
  const resolveSelector = useCallback(
    (id: string): string | null => {
      if (getTargetSelector) return getTargetSelector(id)
      return `[${dataAttribute}="${id}"]`
    },
    [dataAttribute, getTargetSelector],
  )

  const clearFocus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS)
    })
  }, [])

  useEffect(() => {
    if (!focusId || hasTriggeredRef.current) return

    const selector = resolveSelector(focusId)
    if (!selector) return

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = document.querySelector(selector) as HTMLElement | null
        if (!target) return

        hasTriggeredRef.current = true

        target.scrollIntoView({ behavior: scrollBehavior, block: scrollBlock })
        target.classList.add(HIGHLIGHT_CLASS)

        timerRef.current = setTimeout(() => {
          target.classList.remove(HIGHLIGHT_CLASS)
          const newParams = new URLSearchParams(searchParams)
          newParams.delete(FOCUS_PARAM)
          setSearchParams(newParams, { replace: true })
        }, duration)
      })
    })

    return () => cancelAnimationFrame(rafId)
  }, [focusId, resolveSelector, duration, scrollBehavior, scrollBlock, searchParams, setSearchParams])

  useEffect(() => {
    return () => clearFocus()
  }, [clearFocus])

  return {
    focusId,
    hasFocus: Boolean(focusId),
    HIGHLIGHT_CLASS,
  }
}
