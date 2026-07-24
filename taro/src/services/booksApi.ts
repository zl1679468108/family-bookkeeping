/**
 * Books (ledgers) API service.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type { Book } from "../types";
import { API_PATHS } from "../utils/apiPaths";

/** Get all books for current user */
export const fetchBooks = async (): Promise<Book[]> => {
  return apiGet<Book[]>(API_PATHS.books.root, { requiresAuth: true });
};

/** Create a new book */
export const createBook = async (data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<Book> => {
  return apiPost<Book>(API_PATHS.books.root, { data, requiresAuth: true });
};

/** Rename a book */
export const renameBook = async (id: string, name: string): Promise<Book> => {
  return apiPut<Book>(API_PATHS.books.byId(id), { data: { name }, requiresAuth: true });
};

/** Update book details (name, description, icon) */
export const updateBook = async (
  id: string,
  data: { name?: string; description?: string; icon?: string },
): Promise<Book> => {
  return apiPut<Book>(API_PATHS.books.byId(id), { data, requiresAuth: true });
};

/** Delete a book */
export const deleteBook = async (id: string): Promise<void> => {
  return apiDelete<void>(API_PATHS.books.byId(id), { requiresAuth: true });
};

/** Get members of a book */
export const fetchBookMembers = async (bookId: string): Promise<any[]> => {
  return apiGet<any[]>(API_PATHS.books.members(bookId), { requiresAuth: true });
};

/** Invite a member by email */
export const inviteMember = async (
  bookId: string,
  email: string,
): Promise<any> => {
  return apiPost<any>(API_PATHS.books.members(bookId), {
    data: { email },
    requiresAuth: true,
  });
};

/** Create an invitation code */
export const createInvitation = async (
  bookId: string,
): Promise<{ code: string; book_name: string; expires_at: string }> => {
  return apiPost<{ code: string; book_name: string; expires_at: string }>(
    API_PATHS.books.invitations(bookId),
    { requiresAuth: true },
  );
};

/** Query invitation by code */
export const getInvitation = async (
  code: string,
): Promise<{ book_id: string; book_name: string; expires_at: string } | null> => {
  return apiGet<{ book_id: string; book_name: string; expires_at: string } | null>(
    API_PATHS.books.invitationByCode(code),
    { requiresAuth: false },
  );
};

/** Join a book by invitation code */
export const joinByInvitation = async (
  code: string,
): Promise<{ book_id: string; book_name: string }> => {
  return apiPost<{ book_id: string; book_name: string }>(
    API_PATHS.books.joinByCode(code),
    { requiresAuth: true },
  );
};

/** Leave a book */
export const leaveBook = async (bookId: string): Promise<void> => {
  return apiDelete<void>(API_PATHS.books.leave(bookId), { requiresAuth: true });
};

/** Remove a member (owner only) */
export const removeMember = async (
  bookId: string,
  userId: string,
): Promise<void> => {
  return apiDelete<void>(API_PATHS.books.member(bookId, userId), { requiresAuth: true });
};

/** Transfer book ownership */
export const transferOwner = async (
  bookId: string,
  newOwnerEmail: string,
  password: string,
): Promise<void> => {
  return apiPut<void>(API_PATHS.books.transferOwner(bookId), {
    data: { newOwnerEmail, password },
    requiresAuth: true,
  });
};

/** Check if current user is owner */
export const checkOwner = async (
  bookId: string,
): Promise<{ isOwner: boolean }> => {
  return apiGet<{ isOwner: boolean }>(API_PATHS.books.checkOwner(bookId), { requiresAuth: true });
};
