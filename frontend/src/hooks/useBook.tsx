import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notify } from '../utils/notifications';

export interface Book {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

const BOOK_KEY = 'current_book_id';
const DEFAULT_BOOK_NAME_KEY = 'default_book_name';

interface BookContextType {
  /** 当前选中的账本 */
  currentBook: Book | null;
  /** 所有账本列表 */
  books: Book[];
  /** 切换到指定账本 */
  switchBook: (book: Book | null) => void;
  /** 加载中 */
  loading: boolean;
}

const BookContext = createContext<BookContextType>({
  currentBook: null,
  books: [],
  switchBook: () => {},
  loading: false,
});

export const useBook = () => useContext(BookContext);

/** 获取存储的当前账本 ID */
export const getStoredBookId = (): string | null => {
  return localStorage.getItem(BOOK_KEY);
};

/** 存储当前账本 ID */
export const setStoredBookId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(BOOK_KEY, id);
  } else {
    localStorage.removeItem(BOOK_KEY);
  }
};

/** 默认账本名称（localStorage 持久化） */
export const getDefaultBookName = (): string => {
  return localStorage.getItem(DEFAULT_BOOK_NAME_KEY) || '默认账本';
};

export const setDefaultBookName = (name: string): void => {
  localStorage.setItem(DEFAULT_BOOK_NAME_KEY, name);
};

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const queryClient = useQueryClient();

  const { data: books = [], isLoading: loading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { fetchBooks } = await import('../services/booksApi');
      return fetchBooks();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 从 localStorage 恢复上次选择的账本；没有则自动选中默认账本
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
    // 没有缓存或缓存失效 → 选中默认账本
    const defaultBook = books.find((b: Book) => b.name === '默认账本');
    if (defaultBook) {
      setCurrentBook(defaultBook);
      setStoredBookId(defaultBook.id);
    }
  }, [books, currentBook]);

  const switchBook = useCallback((book: Book | null) => {
    setCurrentBook(book);
    setStoredBookId(book?.id ?? null);
    // 切换账本时刷新所有相关数据
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    // 切换提示
    if (book) {
      notify({ type: 'info', message: `已切换到「${book.name}」` });
    }
  }, [queryClient]);

  return (
    <BookContext.Provider value={{ currentBook, books, switchBook, loading }}>
      {children}
    </BookContext.Provider>
  );
};
