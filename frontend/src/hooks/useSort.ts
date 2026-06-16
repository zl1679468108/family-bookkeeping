import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDebouncedAction } from './useDebouncedAction'

/**
 * 可排序项目的接口定义
 */
export interface SortableItem {
  id: string
  sort_order: number
}

/**
 * 可复用排序 Hooks 返回类型
 */
interface UseSortReturn<T extends SortableItem> {
  sortingMode: boolean
  dragIndex: number | null
  orderedList: T[]
  handleEnterSortMode: () => void
  handleSaveSort: () => void
  handleCancelSort: () => void
  handleDragStart: (index: number) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: () => void
  isSorting: boolean
  isSaving: boolean
}

/**
 * 可复用排序 Hooks
 * @param queryKey React Query 的查询键
 * @param list 当前列表数据
 * @param reorderFn 重排序的 API 调用函数，接收包含 id 和 sort_order 的数组
 * @returns 排序相关的状态和处理函数
 */
export function useSort<T extends SortableItem>(
  queryKey: string[],
  list: T[],
  reorderFn?: (orders: { id: string; sort_order: number }[]) => Promise<void>
): UseSortReturn<T> {
  const queryClient = useQueryClient()

  // 排序模式状态
  const [sortingMode, setSortingMode] = useState(false)
  // 拖拽中的索引
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  // 本地排序列表
  const [orderedList, setOrderedList] = useState<T[]>(list)

  // 同步列表数据：非排序模式时始终同步最新数据（包括属性变化）
  // 使用 JSON.stringify 做浅比较，避免仅 ID 相同但属性（如 icon、name）不同时不更新
  useEffect(() => {
    if (!sortingMode) {
      setOrderedList(prev => {
        // 检查每个项目的 JSON 表示是否相同（捕获 icon/name/sort_order 等属性变化）
        const isIdentical = prev.length === list.length &&
          prev.every((item, i) => JSON.stringify(item) === JSON.stringify(list[i]))
        if (isIdentical) return prev
        return list
      })
    }
  }, [list, sortingMode])

  // 进入排序模式
  const handleEnterSortMode = useCallback(() => {
    setSortingMode(true)
    setOrderedList([...list])
  }, [list])

  const { run: handleSaveSort, isRunning: isSaving } = useDebouncedAction(async () => {
    if (reorderFn) {
      const orders = orderedList.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))
      await reorderFn(orders)
    }
    queryClient.invalidateQueries({ queryKey })
    setSortingMode(false)
    setDragIndex(null)
  })

  // 取消排序
  const handleCancelSort = useCallback(() => {
    setSortingMode(false)
    setDragIndex(null)
    setOrderedList(list)
  }, [list])

  // 开始拖拽
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  // 拖拽经过
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return

    const newList = [...orderedList]
    const draggedItem = newList[dragIndex]
    const targetItem = newList[index]

    newList[dragIndex] = targetItem
    newList[index] = draggedItem

    setOrderedList(newList)
    setDragIndex(index)
  }, [dragIndex, orderedList])

  // 放下
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // 拖拽结束
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
