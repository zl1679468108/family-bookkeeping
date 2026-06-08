/**
 * BookContext — 全局账本状态管理
 * 使用手动 fetch 避免 React Query 在 Taro 中的兼容性问题。
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { fetchBooks } from "../services/booksApi";
import { getStoredBookId, setStoredBookId } from "../services/api";
import { useAuth } from "./AuthContext";
import type { Book } from "../types";

interface BookContextType {
  currentBook: Book | null;
  books: Book[];
  switchBook: (book: Book | null) => void;
  loading: boolean;
}

const BookContext = createContext<BookContextType>({
  currentBook: null,
  books: [],
  switchBook: () => {},
  loading: false,
});

export const useBookContext = () => useContext(BookContext);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  // 等认证完成后拉取账本列表
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchBooks()
      .then((data) => {
        setBooks(data);
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [user]);

  // 初始化：从 storage 恢复或自动选中默认账本
  useEffect(() => {
    if (initialized.current || books.length === 0) return;
    initialized.current = true;

    const storedId = getStoredBookId();
    if (storedId) {
      const found = books.find((b) => b.id === storedId);
      if (found) {
        setCurrentBook(found);
        return;
      }
    }
    const defaultBook = books.find((b) => b.name === "默认账本") || books[0];
    if (defaultBook) {
      setCurrentBook(defaultBook);
      setStoredBookId(defaultBook.id);
    }
  }, [books]);

  // 当 books 更新但 currentBook 失效时自动回退
  useEffect(() => {
    if (!currentBook || books.length === 0) return;
    const stillExists = books.some((b) => b.id === currentBook.id);
    if (!stillExists) {
      const fallback =
        books.find((b) => b.name === "默认账本") || books[0] || null;
      setCurrentBook(fallback);
      setStoredBookId(fallback?.id ?? null);
    }
  }, [books, currentBook]);

  const switchBook = useCallback((book: Book | null) => {
    setCurrentBook(book);
    setStoredBookId(book?.id ?? null);
  }, []);

  return (
    <BookContext.Provider value={{ currentBook, books, switchBook, loading }}>
      {children}
    </BookContext.Provider>
  );
};
