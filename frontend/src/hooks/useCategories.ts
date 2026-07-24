import { useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../services/categoriesApi'
import type { Category } from '@family-bookkeeping/shared-types'
import { renderCategoryIcon } from '../utils/renderCategoryIcon'
import { useBook } from './useBook'
import { queryKeys } from '../utils/queryKeys'
import { STALE } from '../utils/cachePolicy'
import {
  filterCategoriesByType,
  buildCategoryLookupMaps,
  getCategoryNameFromLookup,
  getCategoryIconFromLookup,
  getCategoryIdFromLookup,
  buildCategoryOptions,
  type CategoryTypeFilter,
} from '../utils/categories'

/**
 * 全局分类数据 hook
 * 数据来源：后端 /api/categories（用户自定义 + 默认分类）
 * 按账本隔离，staleTime 5 分钟
 */
export function useCategories(type?: CategoryTypeFilter) {
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''

  return useQuery({
    queryKey: queryKeys.categories.list(bookId),
    queryFn: () => fetchCategories(),
    enabled: !!bookId,
    staleTime: STALE.categories,
    select: (data) => filterCategoriesByType(data, type),
  })
}

/**
 * 分类查找工具 hook
 */
export function useCategoryLookup() {
  const { data: categories } = useCategories()

  const { byId: lookupMap, nameToId: nameToIdMap } = useMemo(
    () => buildCategoryLookupMaps(categories as Category[] | undefined),
    [categories],
  )

  const getCategoryName = useCallback(
    (categoryId: string): string => getCategoryNameFromLookup(lookupMap, categoryId),
    [lookupMap],
  )

  const getCategoryIcon = useCallback(
    (categoryId: string): string => getCategoryIconFromLookup(lookupMap, categoryId),
    [lookupMap],
  )

  const getCategoryIconNode = useCallback(
    (categoryId: string, size: number = 18) => {
      const icon = lookupMap[categoryId]?.icon
      return renderCategoryIcon(icon, { size })
    },
    [lookupMap],
  )

  const getCategoryId = useCallback(
    (name: string): string | null => getCategoryIdFromLookup(nameToIdMap, name),
    [nameToIdMap],
  )

  return {
    categories: categories || [],
    lookupMap,
    nameToIdMap,
    getCategoryName,
    getCategoryIcon,
    getCategoryIconNode,
    getCategoryId,
  }
}

export { buildCategoryOptions }
export type { CategoryTypeFilter }
