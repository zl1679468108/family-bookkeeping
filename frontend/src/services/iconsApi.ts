/**
 * Icons 模块 — API 服务层
 * 对接后端 /api/icons/* 接口
 */

import { request } from './api';

export interface CustomIcon {
  id: string;
  user_id: string;
  icon_url: string;
  icon_type: 'category' | 'book' | 'avatar';
  created_at: string;
}

/**
 * 获取用户自定义图标列表
 * GET /icons?icon_type=
 */
export const fetchCustomIcons = async (iconType?: 'category' | 'book' | 'avatar'): Promise<CustomIcon[]> => {
  const query = iconType ? `?icon_type=${iconType}` : '';
  return request<CustomIcon[]>(`/icons${query}`, { requiresAuth: true });
};

/**
 * 上传图标图片
 * POST /icons/upload
 */
export const uploadIcon = async (file: File, iconType: 'category' | 'book' | 'avatar'): Promise<CustomIcon> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('icon_type', iconType);

  return request<CustomIcon>('/icons/upload', {
    method: 'POST',
    requiresAuth: true,
    body: formData,
  });
};

/**
 * 删除图标
 * DELETE /icons/:id
 */
export const deleteIcon = async (iconId: string): Promise<void> => {
  await request<null>(`/icons/${iconId}`, {
    method: 'DELETE',
    requiresAuth: true,
  });
};
