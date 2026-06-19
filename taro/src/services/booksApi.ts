/**
 * Books (ledgers) API service.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type { Book } from "../types";

const BOOKS_PATH = "/books";

/** Get all books for current user */
export const fetchBooks = async (): Promise<Book[]> => {
  return apiGet<Book[]>(BOOKS_PATH, { requiresAuth: true });
};

/** Create a new book */
export const createBook = async (data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<Book> => {
  return apiPost<Book>(BOOKS_PATH, { data, requiresAuth: true });
};

/** Rename a book */
export const renameBook = async (id: string, name: string): Promise<Book> => {
  return apiPut<Book>(`${BOOKS_PATH}/${id}`, { data: { name }, requiresAuth: true });
};

/** Update book details (name, description, icon) */
export const updateBook = async (
  id: string,
  data: { name?: string; description?: string; icon?: string },
): Promise<Book> => {
  return apiPut<Book>(`${BOOKS_PATH}/${id}`, { data, requiresAuth: true });
};

/** Delete a book */
export const deleteBook = async (id: string): Promise<void> => {
  return apiDelete<void>(`${BOOKS_PATH}/${id}`, { requiresAuth: true });
};

/** Get members of a book */
export const fetchBookMembers = async (bookId: string): Promise<any[]> => {
  return apiGet<any[]>(`${BOOKS_PATH}/${bookId}/members`, { requiresAuth: true });
};

/** Invite a member by email */
export const inviteMember = async (
  bookId: string,
  email: string,
): Promise<any> => {
  return apiPost<any>(`${BOOKS_PATH}/${bookId}/members`, {
    data: { email },
    requiresAuth: true,
  });
};

/** Create an invitation code */
export const createInvitation = async (
  bookId: string,
): Promise<{ code: string; book_name: string; expires_at: string }> => {
  return apiPost<{ code: string; book_name: string; expires_at: string }>(
    `${BOOKS_PATH}/${bookId}/invitations`,
    { requiresAuth: true },
  );
};

/** Query invitation by code */
export const getInvitation = async (
  code: string,
): Promise<{ book_id: string; book_name: string; expires_at: string } | null> => {
  return apiGet<{ book_id: string; book_name: string; expires_at: string } | null>(
    `${BOOKS_PATH}/invitations/${encodeURIComponent(code)}`,
    { requiresAuth: false },
  );
};

/** Join a book by invitation code */
export const joinByInvitation = async (
  code: string,
): Promise<{ book_id: string; book_name: string }> => {
  return apiPost<{ book_id: string; book_name: string }>(
    `${BOOKS_PATH}/invitations/${encodeURIComponent(code)}/join`,
    { requiresAuth: true },
  );
};

/** Leave a book */
export const leaveBook = async (bookId: string): Promise<void> => {
  return apiDelete<void>(`${BOOKS_PATH}/${bookId}/members/me`, { requiresAuth: true });
};

/** Remove a member (owner only) */
export const removeMember = async (
  bookId: string,
  userId: string,
): Promise<void> => {
  return apiDelete<void>(`${BOOKS_PATH}/${bookId}/members/${userId}`, { requiresAuth: true });
};

/** Transfer book ownership */
export const transferOwner = async (
  bookId: string,
  newOwnerEmail: string,
  password: string,
): Promise<void> => {
  return apiPut<void>(`${BOOKS_PATH}/${bookId}/transfer-owner`, {
    data: { newOwnerEmail, password },
    requiresAuth: true,
  });
};

/** Check if current user is owner */
export const checkOwner = async (
  bookId: string,
): Promise<{ isOwner: boolean }> => {
  return apiGet<{ isOwner: boolean }>(`${BOOKS_PATH}/${bookId}/check-owner`, { requiresAuth: true });
};
