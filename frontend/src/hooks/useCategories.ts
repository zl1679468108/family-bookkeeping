import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../services/categoriesApi'
import type { Category } from '../types/category'

/**
 * 全局分类数据 hook
 * 数据来源：后端 /api/categories（系统默认 + 用户自定义）
 * staleTime 5 分钟，减少重复请求
 */
export function useCategories(type?: 'expense' | 'income') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => fetchCategories(type),
    staleTime: 5 * 60 * 1000,
  })
}

// 向后兼容旧数据中可能存在的英文 key（如 "food", "food_delivery"）
export const LEGACY_MAP: Record<string, { name: string; icon: string }> = {
  food: { name: '食品', icon: '🛒' },
  food_delivery: { name: '餐饮', icon: '🍜' },
  transport: { name: '交通', icon: '🚗' },
  shopping: { name: '购物', icon: '🛍️' },
  utilities: { name: '通讯', icon: '📱' },
  housing: { name: '居住', icon: '🏠' },
  entertainment: { name: '娱乐', icon: '🎮' },
  medical: { name: '医疗', icon: '💊' },
  education: { name: '教育', icon: '📚' },
  other: { name: '其他', icon: '📌' },
  salary: { name: '工资', icon: '💼' },
  bonus: { name: '奖金', icon: '🎁' },
  investment: { name: '投资', icon: '📈' },
  freelance: { name: '兼职', icon: '💻' },
  gift: { name: '礼金', icon: '🎁' },
  other_income: { name: '其他收入', icon: '💰' },
}

/** 中文名 → 英文 key 反向映射，用于将 categories.name 转为 transactions 中存储的 key */
export function getCategoryKey(displayName: string): string {
  for (const [key, val] of Object.entries(LEGACY_MAP)) {
    if (val.name === displayName) return key
  }
  // 非预设分类 → 直接使用中文名（自定义分类）
  return displayName
}

/**
 * 分类查找工具 hook
 * 返回 { categories, lookupMap, getCategoryName, getCategoryIcon }
 */
export function useCategoryLookup() {
  const { data: categories } = useCategories()

  const lookupMap: Record<string, { name: string; icon: string }> = {}
  categories?.forEach((c: Category) => {
    lookupMap[c.name] = { name: c.name, icon: c.icon }
  })

  const getCategoryName = (categoryValue: string): string => {
    return lookupMap[categoryValue]?.name || LEGACY_MAP[categoryValue]?.name || categoryValue
  }

  const getCategoryIcon = (categoryValue: string): string => {
    return lookupMap[categoryValue]?.icon || LEGACY_MAP[categoryValue]?.icon || '📌'
  }

  return {
    categories: categories || [],
    lookupMap,
    getCategoryName,
    getCategoryIcon,
  }
}

/**
 * 从 Categories 数据生成选择器选项
 * [{ value: '食品', label: '🛒 食品' }, ...]
 */
export function buildCategoryOptions(
  categories: Array<{ name: string; icon: string; type: string }>,
  type: 'expense' | 'income',
) {
  return categories
    .filter((c) => c.type === type)
    .map((c) => ({
      value: getCategoryKey(c.name),
      label: `${c.icon} ${c.name}`,
    }))
}
