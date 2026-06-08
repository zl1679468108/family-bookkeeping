/**
 * Books (ledgers) API service.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./api";
import type { Book } from "../types";

const BOOKS_PATH = "/books";

/** Get all books for current user */
export const fetchBooks = async (): Promise<Book[]> => {
  return apiGet<Book[]>(BOOKS_PATH);
};

/** Create a new book */
export const createBook = async (name: string): Promise<Book> => {
  return apiPost<Book>(BOOKS_PATH, { name });
};

/** Rename a book */
export const renameBook = async (id: string, name: string): Promise<Book> => {
  return apiPut<Book>(`${BOOKS_PATH}/${id}`, { name });
};

/** Delete a book */
export const deleteBook = async (id: string): Promise<void> => {
  return apiDelete<void>(`${BOOKS_PATH}/${id}`);
};

/** Get members of a book */
export const fetchBookMembers = async (bookId: string): Promise<any[]> => {
  return apiGet<any[]>(`${BOOKS_PATH}/${bookId}/members`);
};

/** Invite a member by email */
export const inviteMember = async (
  bookId: string,
  email: string,
): Promise<any> => {
  return apiPost<any>(`${BOOKS_PATH}/${bookId}/members`, { email });
};

/** Leave a book */
export const leaveBook = async (bookId: string): Promise<void> => {
  return apiDelete<void>(`${BOOKS_PATH}/${bookId}/members/me`);
};
