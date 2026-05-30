/**
 * Hook: fetch and lookup categories.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../services/categoriesApi';
import type { Category } from '../types';

/** Fetch categories, optionally filtered by type */
export function useCategories(type?: 'expense' | 'income') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => fetchCategories(type),
    staleTime: 5 * 60 * 1000,
  });
}

/** Category lookup helpers */
export function useCategoryLookup() {
  const { data: categories } = useCategories();

  const lookupMap: Record<string, { name: string; icon: string }> = {};
  const nameToIdMap: Record<string, string> = {};
  categories?.forEach((c: Category) => {
    lookupMap[c.id] = { name: c.name, icon: c.icon };
    nameToIdMap[c.name] = c.id;
  });

  const getCategoryName = (categoryId: string): string =>
    lookupMap[categoryId]?.name || '未知';

  const getCategoryIcon = (categoryId: string): string =>
    lookupMap[categoryId]?.icon || '📌';

  const getCategoryId = (name: string): string | null =>
    nameToIdMap[name] || null;

  return {
    categories: categories || [],
    lookupMap,
    nameToIdMap,
    getCategoryName,
    getCategoryIcon,
    getCategoryId,
  };
}
