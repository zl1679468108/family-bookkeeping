import { request } from './api';
import type { Book } from '../hooks/useBook';

/** 获取当前用户的账本列表 */
export const fetchBooks = async (): Promise<Book[]> => {
  return request<Book[]>('/books', { requiresAuth: true });
};

/** 创建账本 */
export const createBook = async (name: string): Promise<Book> => {
  return request<Book>('/books', { method: 'POST', requiresAuth: true, body: { name } });
};

/** 重命名账本 */
export const renameBook = async (id: string, name: string): Promise<Book> => {
  return request<Book>(`/books/${id}`, { method: 'PUT', requiresAuth: true, body: { name } });
};

/** 删除账本 */
export const deleteBook = async (id: string): Promise<void> => {
  await request(`/books/${id}`, { method: 'DELETE', requiresAuth: true });
};

/** 获取账本成员 */
export const fetchBookMembers = async (bookId: string): Promise<any[]> => {
  return request<any[]>(`/books/${bookId}/members`, { requiresAuth: true });
};

/** 邀请成员 */
export const inviteMember = async (bookId: string, email: string): Promise<void> => {
  await request(`/books/${bookId}/members`, {
    method: 'POST',
    requiresAuth: true,
    body: { email },
  });
};

/** 退出账本 */
export const leaveBook = async (bookId: string): Promise<void> => {
  await request(`/books/${bookId}/members/me`, { method: 'DELETE', requiresAuth: true });
};
