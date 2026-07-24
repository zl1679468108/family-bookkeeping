import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../utils/auth';
import { setCurrentBook as setCurrentBookApi } from '../services/api';
import { fetchBooks } from '../services/booksApi';
;

import { Book } from '@family-bookkeeping/shared-types';
import { notifyError } from '../utils/notifyError'

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

  // 关键修复：books 查询依赖 user.id。用户切换时，query key 变化会自动重新请求
  const { data: books = [], isLoading: booksLoading, refetch } = useQuery({
    queryKey: ['books', user?.id || 'guest'],
    queryFn: () => fetchBooks(),
    // 移除 staleTime，避免长时间用旧缓存
    enabled: !!user, // 只有登录用户才查询
  });

  const refetchBooks = useCallback(async () => {
    try {
      await refetch();
    } catch (e) {
      console.error('刷新账本列表失败', e);
    }
  }, [refetch]);

  // 用户切换时必须重置 currentBook（避免显示旧账号选中的账本）
  useEffect(() => {
    setCurrentBook(null);
  }, [user?.id]);

  // 账本列表加载完成后：按后端的 current_book_id 选中默认账本
  useEffect(() => {
    if (booksLoading || !user || books.length === 0) return;
    // 如果当前已有选中的账本且仍在列表中，不做处理
    if (currentBook && books.some((b: Book) => b.id === currentBook.id)) return;

    const serverBookId = user?.current_book_id;
    if (serverBookId) {
      const found = books.find((b: Book) => b.id === serverBookId);
      if (found) {
        setCurrentBook(found);
        return;
      }
    }
    // 否则选中列表中的第一个账本
    setCurrentBook(books[0]);
  }, [books, booksLoading, user, currentBook]);

  const isOwner = currentBook?.role === 'owner';
  const hasBooks = !booksLoading && books.length > 0;

  const switchBook = useCallback(async (book: Book | null) => {
    setCurrentBook(book);
    if (book?.id) {
      try {
        await setCurrentBookApi(book.id);
      } catch {
        notifyError('设置当前账本失败，请重试');
      }
    }
    // T-H6: await API 成功后再 invalidate，避免竞态
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  }, [queryClient]);

  const setCurrentBookId = useCallback(
    (bookId: string) => {
      const book = books.find((b: Book) => b.id === bookId);
      if (book) switchBook(book);
    },
    [books, switchBook],
  );

  // 关键：Provider value 必须缓存，否则每次渲染会生成新对象，
  // 导致所有 useBook() 消费者重新渲染，进而触发大量 useEffect/useQuery 重新执行
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
