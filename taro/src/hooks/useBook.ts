/**
 * ============================================================
 * useBook — 账本管理 Hook（已被 BookContext 替代，保留作参考）
 * ============================================================
 *
 * 这个 Hook 展示了 useQuery + useQueryClient 的经典用法：
 *
 * 1. useQuery(queryKeys.books.all, fetchBooks)
 *    → 自动请求 /books 接口，缓存结果，key 变化时重新请求
 *
 * 2. invalidate BOOK_SCOPED_ROOT_KEYS
 *    → 切换账本后，让账本域缓存失效，自动重新请求
 *
 * 注意：本项目已改用 BookContext（src/context/BookContext.tsx）
 *       实现全局账本状态管理，这个文件不再被使用。
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBooks } from "../services/booksApi";
import { getStoredBookId, setStoredBookId } from "../services/api";
import type { Book } from "../types";
import { DEFAULT_BOOK_NAME } from "../utils/entityCopy";
import { queryKeys, BOOK_SCOPED_ROOT_KEYS } from "../utils/queryKeys";
import { STALE } from "../utils/cachePolicy";

export function useBook() {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data: books = [], isLoading: loading } = useQuery({
    queryKey: [...queryKeys.books.all],
    queryFn: fetchBooks,
    staleTime: STALE.books,
  });

  // Restore or auto-select book
  useEffect(() => {
    if (currentBook || books.length === 0) return;
    const storedId = getStoredBookId();
    if (storedId) {
      const found = books.find((b: Book) => b.id === storedId);
      if (found) {
        setCurrentBook(found);
        return;
      }
    }
    // Default to first book
    const defaultBook =
      books.find((b: Book) => b.name === DEFAULT_BOOK_NAME) || books[0];
    if (defaultBook) {
      setCurrentBook(defaultBook);
      setStoredBookId(defaultBook.id);
    }
  }, [books, currentBook]);

  const switchBook = useCallback(
    (book: Book | null) => {
      setCurrentBook(book);
      setStoredBookId(book?.id ?? null);
      BOOK_SCOPED_ROOT_KEYS.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [...key] });
      });
    },
    [queryClient],
  );

  return { currentBook, books, switchBook, loading };
}
