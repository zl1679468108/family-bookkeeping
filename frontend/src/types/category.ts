/**
 * 自定义分类 — 前端类型定义
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  sort_order: number;
  /** 是否为默认分类（后端使用 is_default） */
  is_default?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  icon: string;
  type: 'expense' | 'income';
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  sort_order?: number;
}
