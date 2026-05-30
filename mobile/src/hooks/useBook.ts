/**
 * Hook: manage current book (ledger) selection.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBooks } from '../services/booksApi';
import { getStoredBookId, setStoredBookId } from '../services/api';
import type { Book } from '../types';

export function useBook() {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data: books = [], isLoading: loading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
    staleTime: 5 * 60 * 1000,
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
    const defaultBook = books.find((b: Book) => b.name === '默认账本') || books[0];
    if (defaultBook) {
      setCurrentBook(defaultBook);
      setStoredBookId(defaultBook.id);
    }
  }, [books, currentBook]);

  const switchBook = useCallback(
    (book: Book | null) => {
      setCurrentBook(book);
      setStoredBookId(book?.id ?? null);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    [queryClient],
  );

  return { currentBook, books, switchBook, loading };
}
