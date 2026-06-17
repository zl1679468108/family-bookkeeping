/**
 * Hook: fetch and lookup categories.
 * 使用手动 fetch 避免 React Query 在 Taro 中的兼容性问题。
 */
import { useState, useEffect } from "react";
import { fetchCategories } from "../services/categoriesApi";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../types";

/** Fetch categories, optionally filtered by type. Only fires when authenticated. */
export function useCategories(type?: "expense" | "income") {
  const { user } = useAuth();
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setData([]);
      return;
    }
    setIsLoading(true);
    fetchCategories(type)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [user, type]);

  return { data, isLoading };
}

/** Alias for useCategories — returns categories as a flat array */
export function useCategoryList(type?: "expense" | "income") {
  const { user } = useAuth();
  const { data, isLoading } = useCategories(type);
  return { categories: user ? (data || []) : [], isLoading };
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
    lookupMap[categoryId]?.name || "未知";

  const getCategoryIcon = (categoryId: string): string =>
    lookupMap[categoryId]?.icon || "📌";

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
