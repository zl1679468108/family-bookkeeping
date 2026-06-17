/**
 * Categories API service.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";

const CATEGORIES_PATH = "/categories";

/** Fetch categories, optionally filtered by type */
export const fetchCategories = async (
  type?: "income" | "expense",
): Promise<Category[]> => {
  const query = type ? `?type=${type}` : "";
  return apiGet<Category[]>(`${CATEGORIES_PATH}${query}`, { requiresAuth: true });
};

/** Create custom category */
export const createCategory = async (
  dto: CreateCategoryInput,
): Promise<Category> => {
  return apiPost<Category>(CATEGORIES_PATH, { data: dto, requiresAuth: true });
};

/** Update custom category */
export const updateCategory = async (
  id: string,
  dto: UpdateCategoryInput,
): Promise<Category> => {
  return apiPut<Category>(`${CATEGORIES_PATH}/${id}`, { data: dto, requiresAuth: true });
};

/** Delete custom category */
export const deleteCategory = async (id: string): Promise<void> => {
  return apiDelete<void>(`${CATEGORIES_PATH}/${id}`, { requiresAuth: true });
};
