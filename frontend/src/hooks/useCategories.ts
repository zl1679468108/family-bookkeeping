import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../services/categoriesApi'
import type { Category } from '../types/category'

/**
 * 全局分类数据 hook
 * 数据来源：后端 /api/categories（用户自定义 + 默认分类）
 * staleTime 5 分钟，减少重复请求
 */
export function useCategories(type?: 'expense' | 'income') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => fetchCategories(type),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 分类查找工具 hook
 * 返回 { categories, lookupMap, getCategoryName, getCategoryIcon, getCategoryId }
 * 所有查找基于 category.id (UUID)
 */
export function useCategoryLookup() {
  const { data: categories } = useCategories()

  const lookupMap: Record<string, { name: string; icon: string }> = {}
  const nameToIdMap: Record<string, string> = {}
  categories?.forEach((c: Category) => {
    lookupMap[c.id] = { name: c.name, icon: c.icon }
    nameToIdMap[c.name] = c.id
  })

  const getCategoryName = (categoryId: string): string => {
    return lookupMap[categoryId]?.name || '未知'
  }

  const getCategoryIcon = (categoryId: string): string => {
    return lookupMap[categoryId]?.icon || '📌'
  }

  /** 根据分类中文名反查 ID（用于 OCR 等场景） */
  const getCategoryId = (name: string): string | null => {
    return nameToIdMap[name] || null
  }

  return {
    categories: categories || [],
    lookupMap,
    nameToIdMap,
    getCategoryName,
    getCategoryIcon,
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
