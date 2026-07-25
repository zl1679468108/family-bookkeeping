/**
 * Hook: fetch and lookup categories.
 * 走 useManualQuery 共享缓存 + 并发去重，避免多处 hook 各打一遍 /categories。
 *
 * ⚠️ 分类只拉取一次（不按 type 过滤请求后端），前端按 type 过滤。
 */
import { useMemo } from "react";
import { fetchCategories } from "../services/categoriesApi";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../types";
import { useManualQuery } from "./useManualQuery";
import { STALE } from "../utils/cachePolicy";
import {
  filterCategoriesByType,
  buildCategoryLookupMaps,
  getCategoryNameFromLookup,
  getCategoryIconFromLookup,
  getCategoryIdFromLookup,
  buildCategoryOptions,
  type CategoryTypeFilter,
} from "../../../shared-utils/src/categories";

/** Fetch all categories once. Only fires when authenticated. */
export function useCategories() {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useManualQuery<Category[]>({
    key: "categories",
    queryFn: () => fetchCategories(),
    enabled: !!user,
    staleTime: STALE.categories,
  });

  return {
    data: user ? data ?? [] : [],
    isLoading: user ? isLoading : false,
    refetch,
  };
}

/** Alias — returns categories, optionally filtered by type on the frontend */
export function useCategoryList(type?: CategoryTypeFilter) {
  const { user } = useAuth();
  const { data, isLoading, refetch } = useCategories();
  const categories = useMemo(
    () => filterCategoriesByType(data, type),
    [data, type],
  );
  return { categories: user ? categories : [], isLoading, refetch };
}

/** Category lookup helpers */
export function useCategoryLookup() {
  const { data: categories, isLoading, refetch } = useCategories();

  const { byId: lookupMap, nameToId: nameToIdMap } = useMemo(
    () => buildCategoryLookupMaps(categories),
    [categories],
  );

  const getCategoryName = (categoryId: string): string =>
    getCategoryNameFromLookup(lookupMap, categoryId);

  const getCategoryIcon = (categoryId: string): string =>
    getCategoryIconFromLookup(lookupMap, categoryId);

  const getCategoryId = (name: string): string | null =>
    getCategoryIdFromLookup(nameToIdMap, name);

  return {
    categories: categories || [],
    isLoading,
    refetch,
    lookupMap,
    nameToIdMap,
    getCategoryName,
    getCategoryIcon,
    getCategoryId,
  };
}

export { buildCategoryOptions };
export type { CategoryTypeFilter };
