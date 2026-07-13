/**
 * Hook: fetch and lookup categories.
 * 使用手动 fetch 避免 React Query 在 Taro 中的兼容性问题。
 *
 * ⚠️ 分类只拉取一次（不按 type 过滤请求后端），前端按 type 过滤。
 * 这样在「记一笔」表单里切换 支出/收入 时不会反复请求分类接口。
 */
import { useState, useEffect, useMemo } from "react";
import { fetchCategories } from "../services/categoriesApi";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../types";

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
    // 一次性拉取全部分类，前端再按 type 过滤
    fetchCategories()
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [user]);

  return { data, isLoading };
}

/** Alias — returns categories, optionally filtered by type on the frontend */
export function useCategoryList(type?: "expense" | "income") {
  const { user } = useAuth();
  const { data, isLoading } = useCategories();
  const categories = useMemo(
    () => (type ? data.filter((c) => c.type === type) : data),
    [data, type],
  );
  return { categories: user ? categories : [], isLoading };
}

/** Category lookup helpers */
export function useCategoryLookup() {
  const { data: categories } = useCategories();

  // 缓存 lookup 表，避免每次渲染重建
  const lookupMap = useMemo(() => {
    const map: Record<string, { name: string; icon: string }> = {};
    categories?.forEach((c: Category) => {
      map[c.id] = { name: c.name, icon: c.icon };
    });
    return map;
  }, [categories]);

  const nameToIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories?.forEach((c: Category) => {
      map[c.name] = c.id;
    });
    return map;
  }, [categories]);

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
