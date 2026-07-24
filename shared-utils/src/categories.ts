/**
 * 分类列表纯函数 — 双端 useCategories / 下拉选项 / 查找表共用
 */

export const UNKNOWN_CATEGORY_NAME = '未知'
export const DEFAULT_CATEGORY_ICON = '📌'

export type CategoryLike = {
  id: string
  name: string
  icon: string
  type: string
}

export type CategoryTypeFilter = 'expense' | 'income'

export function filterCategoriesByType<T extends { type: string }>(
  categories: readonly T[] | null | undefined,
  type?: CategoryTypeFilter | null,
): T[] {
  const list = categories ? categories.slice() : []
  if (!type) return list
  return list.filter((c) => c.type === type)
}

export type CategoryLookupMaps = {
  byId: Record<string, { name: string; icon: string }>
  nameToId: Record<string, string>
}

export function buildCategoryLookupMaps(
  categories: readonly CategoryLike[] | null | undefined,
): CategoryLookupMaps {
  const byId: Record<string, { name: string; icon: string }> = {}
  const nameToId: Record<string, string> = {}
  categories?.forEach((c) => {
    byId[c.id] = { name: c.name, icon: c.icon }
    nameToId[c.name] = c.id
  })
  return { byId, nameToId }
}

export function getCategoryNameFromLookup(
  byId: CategoryLookupMaps['byId'],
  categoryId: string,
  fallback = UNKNOWN_CATEGORY_NAME,
): string {
  return byId[categoryId]?.name || fallback
}

export function getCategoryIconFromLookup(
  byId: CategoryLookupMaps['byId'],
  categoryId: string,
  fallback = DEFAULT_CATEGORY_ICON,
): string {
  return byId[categoryId]?.icon || fallback
}

export function getCategoryIdFromLookup(
  nameToId: CategoryLookupMaps['nameToId'],
  name: string,
): string | null {
  return nameToId[name] || null
}

/** 下拉选项：过滤 type 后拼「图标 名称」label */
export function buildCategoryOptions(
  categories: ReadonlyArray<CategoryLike>,
  type: CategoryTypeFilter,
): Array<{ value: string; label: string }> {
  return categories
    .filter((c) => c.type === type)
    .map((c) => ({
      value: c.id,
      label: `${c.icon} ${c.name}`,
    }))
}

/** 按 sort_order 升序（无字段时保持相对顺序） */
export function sortCategoriesByOrder<T extends { sort_order?: number }>(
  categories: readonly T[],
): T[] {
  return categories.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}
