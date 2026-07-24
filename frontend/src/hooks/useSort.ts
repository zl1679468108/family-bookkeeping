import { useState, useCallback, useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useDebouncedAction } from './useDebouncedAction'
import {
  decideSortSave,
  toSortOrders,
  swapIndices,
  type SortSaveDecision,
} from '../utils/sortOrder'

/**
 * 可排序项目的接口定义
 */
export interface SortableItem {
  id: string
  sort_order: number
}

/** 保存结果：与 Taro useReorder 语义对齐 */
export type SortSaveResult = Exclude<SortSaveDecision, 'changed'> | 'saved'

/**
 * 可复用排序 Hooks 返回类型
 */
interface UseSortReturn<T extends SortableItem> {
  sortingMode: boolean
  dragIndex: number | null
  orderedList: T[]
  handleEnterSortMode: () => void
  handleSaveSort: () => Promise<SortSaveResult | undefined>
  handleCancelSort: () => void
  handleDragStart: (index: number) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: () => void
  isSorting: boolean
  isSaving: boolean
}

/**
 * 可复用排序 Hooks（PC 拖拽）
 * - 无变化 / 空列表：不打 API，退出排序模式并返回对应结果
 * - 有变化：提交 { id, sort_order }[] 后刷新
 */
export function useSort<T extends SortableItem>(
  queryKey: QueryKey,
  list: T[],
  reorderFn?: (orders: { id: string; sort_order: number }[]) => Promise<void>
): UseSortReturn<T> {
  const queryClient = useQueryClient()

  const [sortingMode, setSortingMode] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [orderedList, setOrderedList] = useState<T[]>(list)

  useEffect(() => {
    if (!sortingMode) {
      setOrderedList(prev => {
        const isIdentical =
          prev.length === list.length &&
          prev.every((item, i) => JSON.stringify(item) === JSON.stringify(list[i]))
        if (isIdentical) return prev
        return list
      })
    }
  }, [list, sortingMode])

  const handleEnterSortMode = useCallback(() => {
    setSortingMode(true)
    setOrderedList([...list])
  }, [list])

  const exitSortMode = useCallback(() => {
    setSortingMode(false)
    setDragIndex(null)
  }, [])

  const { run: handleSaveSort, isRunning: isSaving } = useDebouncedAction(
    async (): Promise<SortSaveResult> => {
      const originalIds = list.map((item) => item.id)
      const orderedIds = orderedList.map((item) => item.id)
      const decision = decideSortSave(originalIds, orderedIds)

      if (decision === 'empty' || decision === 'unchanged') {
        setOrderedList(list)
        exitSortMode()
        return decision
      }

      if (reorderFn) {
        await reorderFn(toSortOrders(orderedIds))
      }
      queryClient.invalidateQueries({ queryKey })
      exitSortMode()
      return 'saved'
    },
  )

  const handleCancelSort = useCallback(() => {
    setOrderedList(list)
    exitSortMode()
  }, [list, exitSortMode])

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      if (dragIndex === null || dragIndex === index) return
      setOrderedList((prev) => swapIndices(prev, dragIndex, index))
      setDragIndex(index)
    },
    [dragIndex],
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
  }, [])

  return {
    sortingMode,
    dragIndex,
    orderedList,
    handleEnterSortMode,
    handleSaveSort,
    handleCancelSort,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isSorting: sortingMode,
    isSaving,
  }
}
