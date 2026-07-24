/**
 * Categories 模块 — API 服务层
 * 对接后端 /api/categories/* 接口，复用 services/api.ts 中的 request<T>() 函数
 */

import { request } from './api';
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@family-bookkeeping/shared-types';
import { API_PATHS } from '../utils/apiPaths';

/**
 * 获取分类列表
 * GET /categories?type=
 */
export const fetchCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
  return request<Category[]>(API_PATHS.categories.list(type), { requiresAuth: true });
};

/**
 * 创建自定义分类
 * POST /categories
 */
export const createCategory = async (dto: CreateCategoryInput): Promise<Category> => {
  return request<Category>(API_PATHS.categories.root, {
    method: 'POST',
    requiresAuth: true,
    body: dto,
  });
};

/**
 * 更新自定义分类
 * PUT /categories/:id
 */
export const updateCategory = async (
  id: string,
  dto: UpdateCategoryInput,
): Promise<Category> => {
  return request<Category>(API_PATHS.categories.byId(id), {
    method: 'PUT',
    requiresAuth: true,
    body: dto,
  });
};

/**
 * 删除自定义分类
 * DELETE /categories/:id
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await request<null>(API_PATHS.categories.byId(id), {
    method: 'DELETE',
    requiresAuth: true,
  });
};

/**
 * 批量更新分类排序
 * PATCH /categories/reorder
 */
export const reorderCategories = async (orders: { id: string; sort_order: number }[]): Promise<void> => {
  await request<null>(API_PATHS.categories.reorder, {
    method: 'PATCH',
    requiresAuth: true,
    body: { orders },
  });
};
