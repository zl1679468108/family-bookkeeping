/**
 * Books (ledgers) API service.
 */

import apiClient from './api';
import type { Book } from '../types';

const BOOKS_PATH = '/books';

/** Get all books for current user */
export const fetchBooks = async (): Promise<Book[]> => {
  const { data } = await apiClient.get<Book[]>(BOOKS_PATH);
  return data;
};

/** Create a new book */
export const createBook = async (name: string): Promise<Book> => {
  const { data } = await apiClient.post<Book>(BOOKS_PATH, { name });
  return data;
};

/** Rename a book */
export const renameBook = async (id: string, name: string): Promise<Book> => {
  const { data } = await apiClient.put<Book>(`${BOOKS_PATH}/${id}`, { name });
  return data;
};

/** Delete a book */
export const deleteBook = async (id: string): Promise<void> => {
  await apiClient.delete(`${BOOKS_PATH}/${id}`);
};

/** Get members of a book */
export const fetchBookMembers = async (bookId: string): Promise<any[]> => {
  const { data } = await apiClient.get<any[]>(`${BOOKS_PATH}/${bookId}/members`);
  return data;
};

/** Invite a member by email */
export const inviteMember = async (bookId: string, email: string): Promise<any> => {
  const { data } = await apiClient.post<any>(`${BOOKS_PATH}/${bookId}/members`, { email });
  return data;
};

/** Leave a book */
export const leaveBook = async (bookId: string): Promise<void> => {
  await apiClient.delete(`${BOOKS_PATH}/${bookId}/members/me`);
};
