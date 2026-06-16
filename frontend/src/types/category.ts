/**
 * 自定义分类 — 前端类型定义
 */
export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  is_default?: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  icon_id?: string;
  type: 'expense' | 'income';
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  icon_id?: string;
  sort_order?: number;
}
