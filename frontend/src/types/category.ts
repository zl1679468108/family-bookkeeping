/**
 * 自定义分类 — 前端类型定义
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  sort_order: number;
  /** 前端标注，默认分类为 true */
  isDefault?: boolean;
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
