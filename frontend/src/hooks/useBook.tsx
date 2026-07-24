import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../utils/auth';
import { setCurrentBook as setCurrentBookApi } from '../services/api';
import { fetchBooks } from '../services/booksApi';
import { Book } from '@family-bookkeeping/shared-types';
import { notifyError } from '../utils/notifyError'
import { queryKeys, BOOK_SCOPED_ROOT_KEYS } from '../utils/queryKeys'
import { STALE } from '../utils/cachePolicy'
import { clearAddTransactionDraft } from '../utils/addTransactionDraft'

interface BookContextType {
  currentBook: Book | null;
  books: Book[];
  switchBook: (book: Book | null) => void;
  loading: boolean;
  isOwner: boolean;
  setCurrentBookId: (bookId: string) => void;
  hasBooks: boolean;
  refetchBooks: () => Promise<void>;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

const useBook = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};
export { useBook };

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading: booksLoading, refetch } = useQuery({
    queryKey: queryKeys.books.list(user?.id || 'guest'),
    queryFn: () => fetchBooks(),
    staleTime: STALE.books,
    enabled: !!user,
  });

  const refetchBooks = useCallback(async () => {
    try {
      await refetch();
    } catch (e) {
      console.error('刷新账本列表失败', e);
    }
  }, [refetch]);

  useEffect(() => {
    setCurrentBook(null);
  }, [user?.id]);

  useEffect(() => {
    if (booksLoading || !user || books.length === 0) return;
    if (currentBook && books.some((b: Book) => b.id === currentBook.id)) return;

    const serverBookId = user?.current_book_id;
    if (serverBookId) {
      const found = books.find((b: Book) => b.id === serverBookId);
      if (found) {
        setCurrentBook(found);
        return;
      }
    }
    setCurrentBook(books[0]);
  }, [books, booksLoading, user, currentBook]);

  const isOwner = currentBook?.role === 'owner';
  const hasBooks = !booksLoading && books.length > 0;

  const switchBook = useCallback(async (book: Book | null) => {
    const prevBookId = currentBook?.id;
    setCurrentBook(book);
    if (book?.id) {
      try {
        await setCurrentBookApi(book.id);
      } catch {
        notifyError('设置当前账本失败，请重试');
      }
    }
    BOOK_SCOPED_ROOT_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [...key] });
    });
    if (prevBookId && prevBookId !== book?.id) {
      clearAddTransactionDraft(prevBookId);
    }
  }, [queryClient, currentBook?.id]);

  const setCurrentBookId = useCallback(
    (bookId: string) => {
      const book = books.find((b: Book) => b.id === bookId);
      if (book) switchBook(book);
    },
    [books, switchBook],
  );

  const contextValue = useMemo<BookContextType>(
    () => ({
      currentBook,
      books,
      switchBook,
      loading: booksLoading,
      isOwner,
      setCurrentBookId,
      hasBooks,
      refetchBooks,
    }),
    [currentBook, books, switchBook, booksLoading, isOwner, setCurrentBookId, hasBooks, refetchBooks],
  );

  return (
    <BookContext.Provider value={contextValue}>
      {children}
    </BookContext.Provider>
  );
};
