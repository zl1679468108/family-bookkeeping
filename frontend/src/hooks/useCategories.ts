import { useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../services/categoriesApi'
import type { Category } from '../types/category'
import { renderCategoryIcon } from '../utils/renderCategoryIcon'

/**
 * 全局分类数据 hook
 * 数据来源：后端 /api/categories（用户自定义 + 默认分类）
 * staleTime 30 秒，保持数据新鲜的同时减少重复请求
 */
export function useCategories(type?: 'expense' | 'income') {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: 30 * 1000,
    select: (data) => {
      if (type) {
        return data.filter(c => c.type === type);
      }
      return data;
    }
  })
}

/**
 * 分类查找工具 hook
 * 返回 { categories, lookupMap, getCategoryName, getCategoryIcon, getCategoryId }
 * 所有查找基于 category.id (UUID)
 */
export function useCategoryLookup() {
  const { data: categories } = useCategories()

  const lookupMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {}
    categories?.forEach((c: Category) => {
      map[c.id] = { name: c.name, icon: c.icon }
    })
    return map
  }, [categories])

  const nameToIdMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories?.forEach((c: Category) => {
      map[c.name] = c.id
    })
    return map
  }, [categories])

  const getCategoryName = useCallback((categoryId: string): string => {
    return lookupMap[categoryId]?.name || '未知'
  }, [lookupMap])

  const getCategoryIcon = useCallback((categoryId: string): string => {
    return lookupMap[categoryId]?.icon || '📌'
  }, [lookupMap])

  const getCategoryIconNode = useCallback((categoryId: string, size: number = 18) => {
    const icon = lookupMap[categoryId]?.icon
    return renderCategoryIcon(icon, { size })
  }, [lookupMap])

  const getCategoryId = useCallback((name: string): string | null => {
    return nameToIdMap[name] || null
  }, [nameToIdMap])

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

/**
 * 从 Categories 数据生成选择器选项
 * [{ value: 'uuid', label: '🛒 购物' }, ...]
 */
export function buildCategoryOptions(
  categories: Array<{ id: string; name: string; icon: string; type: string }>,
  type: 'expense' | 'income',
) {
  return categories
    .filter((c) => c.type === type)
    .map((c) => ({
      value: c.id,
      label: `${c.icon} ${c.name}`,
    }))
}
