/**
 * Categories API service.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "./api";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";
import { API_PATHS } from "../utils/apiPaths";

/** Fetch categories, optionally filtered by type */
export const fetchCategories = async (
  type?: "income" | "expense",
): Promise<Category[]> => {
  return apiGet<Category[]>(API_PATHS.categories.list(type), { requiresAuth: true });
};

/** Create custom category */
export const createCategory = async (
  dto: CreateCategoryInput,
): Promise<Category> => {
  return apiPost<Category>(API_PATHS.categories.root, { data: dto, requiresAuth: true });
};

/** Update custom category */
export const updateCategory = async (
  id: string,
  dto: UpdateCategoryInput,
): Promise<Category> => {
  return apiPut<Category>(API_PATHS.categories.byId(id), { data: dto, requiresAuth: true });
};

/** Delete custom category */
export const deleteCategory = async (id: string): Promise<void> => {
  return apiDelete<void>(API_PATHS.categories.byId(id), { requiresAuth: true });
};

/** Reorder categories (PATCH /categories/reorder with { orders: [...]) */
export const reorderCategories = async (
  orders: { id: string; sort_order: number }[],
): Promise<void> => {
  return apiPatch<void>(API_PATHS.categories.reorder, { data: { orders }, requiresAuth: true });
};
