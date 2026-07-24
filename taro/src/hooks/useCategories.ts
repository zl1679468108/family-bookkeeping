/**
 * Hook: fetch and lookup categories.
 * 使用手动 fetch 避免 React Query 在 Taro 中的兼容性问题。
 *
 * ⚠️ 分类只拉取一次（不按 type 过滤请求后端），前端按 type 过滤。
 */
import { useState, useEffect, useMemo } from "react";
import { fetchCategories } from "../services/categoriesApi";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../types";
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
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setData([]);
      return;
    }
    setIsLoading(true);
    // ⚠️ 用 .then() 兜底复位而非 .finally()，规避微信 regenerator 下 .finally 偶发不执行
    fetchCategories()
      .then(setData)
      .catch(() => setData([]))
      .then(() => setIsLoading(false));
  }, [user]);

  return { data, isLoading };
}

/** Alias — returns categories, optionally filtered by type on the frontend */
export function useCategoryList(type?: CategoryTypeFilter) {
  const { user } = useAuth();
  const { data, isLoading } = useCategories();
  const categories = useMemo(
    () => filterCategoriesByType(data, type),
    [data, type],
  );
  return { categories: user ? categories : [], isLoading };
}

/** Category lookup helpers */
export function useCategoryLookup() {
  const { data: categories } = useCategories();

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
    lookupMap,
    nameToIdMap,
    getCategoryName,
    getCategoryIcon,
    getCategoryId,
  };
}

export { buildCategoryOptions };
export type { CategoryTypeFilter };
