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
  useMemo,
} from "react";
import { fetchBooks } from "../services/booksApi";
import { setCurrentBook as setCurrentBookApi } from "../services/authApi";
import { getStoredBookId, setStoredBookId } from "../services/api";
import { useAuth } from "./AuthContext";
import type { Book } from "../types";

interface BookContextType {
  currentBook: Book | null;
  books: Book[];
  switchBook: (book: Book | null) => void;
  /** 重新拉取账本列表（创建/加入后调用，避免缓存为空导致引导循环） */
  refetchBooks: () => Promise<Book[]>;
  loading: boolean;
}

const BookContext = createContext<BookContextType>({
  currentBook: null,
  books: [],
  switchBook: () => {},
  refetchBooks: async () => [],
  loading: false,
});

export const useBookContext = () => useContext(BookContext);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  // loading 初始值：user 存在时默认为 true（fetch effect 尚未执行时子组件已读到 loading=true，避免竞态误跳转）
  const [loading, setLoading] = useState(!!user);
  const initialized = useRef(false);

  // 用户切换时重置账本状态，防止旧账本残留
  useEffect(() => {
    setCurrentBook(null);
    setBooks([]);
    initialized.current = false;
  }, [user?.id]);

  // 等认证完成后拉取账本列表
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // ⚠️ 用 .then() 兜底复位而非 .finally()，规避微信 regenerator 下 .finally 偶发不执行导致全屏 loading 卡死
    fetchBooks()
      .then((data) => {
        setBooks(data);
      })
      .catch(() => setBooks([]))
      .then(() => setLoading(false));
  }, [user]);

  // 初始化：优先使用服务端 current_book_id，其次本地 storage，最后默认账本
  useEffect(() => {
    if (initialized.current || books.length === 0) return;
    initialized.current = true;

    // 1. 服务端持久化的当前账本
    const serverBookId = user?.current_book_id;
    if (serverBookId) {
      const found = books.find((b) => b.id === serverBookId);
      if (found) {
        setCurrentBook(found);
        setStoredBookId(found.id);
        return;
      }
    }

    // 2. 本地存储
    const storedId = getStoredBookId();
    if (storedId) {
      const found = books.find((b) => b.id === storedId);
      if (found) {
        setCurrentBook(found);
        return;
      }
    }

    // 3. 默认账本
    const defaultBook = books.find((b) => b.name === "默认账本") || books[0];
    if (defaultBook) {
      setCurrentBook(defaultBook);
      setStoredBookId(defaultBook.id);
    }
  }, [books, user]);

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
    if (book?.id) {
      setCurrentBookApi(book.id).catch((err) =>
        console.error("[BookContext] 设置当前账本失败", err),
      );
    }
  }, []);

  /** 重新拉取账本列表。返回最新数据，供 Onboarding 创建/加入后定位新账本 */
  const refetchBooks = useCallback(async (): Promise<Book[]> => {
    if (!user) return [];
    try {
      const data = await fetchBooks();
      setBooks(data);
      return data;
    } catch (err) {
      console.error("[BookContext] 拉取账本失败", err);
      return [];
    }
  }, [user]);

  // 关键：缓存 Provider value 避免每次渲染生成新对象导致全量重渲染
  const contextValue = useMemo<BookContextType>(
    () => ({ currentBook, books, switchBook, refetchBooks, loading }),
    [currentBook, books, switchBook, refetchBooks, loading],
  );

  return (
    <BookContext.Provider value={contextValue}>
      {children}
    </BookContext.Provider>
  );
};
