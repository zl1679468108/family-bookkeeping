/**
 * Categories API service.
 */

import apiClient from './api';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types';

const CATEGORIES_PATH = '/categories';

/** Fetch categories, optionally filtered by type */
export const fetchCategories = async (
  type?: 'income' | 'expense',
): Promise<Category[]> => {
  const query = type ? `?type=${type}` : '';
  const { data } = await apiClient.get<Category[]>(
    `${CATEGORIES_PATH}${query}`,
  );
  return data;
};

/** Create custom category */
export const createCategory = async (
  dto: CreateCategoryInput,
): Promise<Category> => {
  const { data } = await apiClient.post<Category>(CATEGORIES_PATH, dto);
  return data;
};

/** Update custom category */
export const updateCategory = async (
  id: string,
  dto: UpdateCategoryInput,
): Promise<Category> => {
  const { data } = await apiClient.put<Category>(
    `${CATEGORIES_PATH}/${id}`,
    dto,
  );
  return data;
};

/** Delete custom category */
export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`${CATEGORIES_PATH}/${id}`);
};
