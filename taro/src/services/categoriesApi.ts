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
  return apiGet<Category[]>(`${CATEGORIES_PATH}${query}`);
};

/** Create custom category */
export const createCategory = async (
  dto: CreateCategoryInput,
): Promise<Category> => {
  return apiPost<Category>(CATEGORIES_PATH, dto);
};

/** Update custom category */
export const updateCategory = async (
  id: string,
  dto: UpdateCategoryInput,
): Promise<Category> => {
  return apiPut<Category>(`${CATEGORIES_PATH}/${id}`, dto);
};

/** Delete custom category */
export const deleteCategory = async (id: string): Promise<void> => {
  return apiDelete<void>(`${CATEGORIES_PATH}/${id}`);
};
