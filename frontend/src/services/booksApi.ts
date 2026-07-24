import { request } from './api';
import type { Book } from '@family-bookkeeping/shared-types';
import { API_PATHS } from '../utils/apiPaths';

/** 获取当前用户的账本列表 */
export const fetchBooks = async (): Promise<Book[]> => {
  return request<Book[]>(API_PATHS.books.root, { requiresAuth: true });
};

/** 创建账本 */
export const createBook = async (data: { name: string; description?: string; icon?: string }): Promise<Book> => {
  return request<Book>(API_PATHS.books.root, { method: 'POST', requiresAuth: true, body: data });
};

/** 更新账本 */
export const updateBook = async (data: { id: string; name: string; description?: string; icon?: string; icon_id?: string }): Promise<Book> => {
  return request<Book>(API_PATHS.books.byId(data.id), { method: 'PUT', requiresAuth: true, body: { name: data.name, description: data.description, icon: data.icon, icon_id: data.icon_id } });
};

/** 删除账本 */
export const deleteBook = async (id: string): Promise<void> => {
  await request(API_PATHS.books.byId(id), { method: 'DELETE', requiresAuth: true });
};

/** 获取账本成员 */
export const fetchBookMembers = async (bookId: string): Promise<any[]> => {
  return request<any[]>(API_PATHS.books.members(bookId), { requiresAuth: true });
};

/** 邀请成员 */
export const inviteMember = async (bookId: string, email: string): Promise<void> => {
  await request(API_PATHS.books.members(bookId), {
    method: 'POST',
    requiresAuth: true,
    body: { email },
  });
};

/** 退出账本 */
export const leaveBook = async (bookId: string): Promise<void> => {
  await request(API_PATHS.books.leave(bookId), { method: 'DELETE', requiresAuth: true });
};

/** 移除成员 */
export const removeMember = async (bookId: string, userId: string): Promise<void> => {
  await request(API_PATHS.books.member(bookId, userId), { method: 'DELETE', requiresAuth: true });
};

/** 转让账本所有权 */
export const transferOwner = async (
  bookId: string,
  newOwnerEmail: string,
  password: string,
): Promise<void> => {
  await request(API_PATHS.books.transferOwner(bookId), {
    method: 'PUT',
    requiresAuth: true,
    body: { newOwnerEmail, password },
  });
};

/** 生成账本邀请码（Owner 专用） */
export const createInvitation = async (
  bookId: string,
): Promise<{ code: string; book_name: string; expires_at: string }> => {
  return request<{ code: string; book_name: string; expires_at: string }>(API_PATHS.books.invitations(bookId), {
    method: 'POST',
    requiresAuth: true,
  });
};

/** 查询邀请码对应的账本信息 */
export const getInvitation = async (
  code: string,
): Promise<{ book_id: string; book_name: string; expires_at: string } | null> => {
  return request<{ book_id: string; book_name: string; expires_at: string } | null>(API_PATHS.books.invitationByCode(code), {
    requiresAuth: true,
  });
};

/** 使用邀请码加入账本 */
export const joinByInvitation = async (
  code: string,
  options?: { notifyOnError?: boolean },
): Promise<{ book_id: string; book_name: string }> => {
  return request<{ book_id: string; book_name: string }>(API_PATHS.books.joinByCode(code), {
    method: 'POST',
    requiresAuth: true,
    notifyOnError: options?.notifyOnError,
  });
};
