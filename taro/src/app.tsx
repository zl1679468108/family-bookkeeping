/**
 * ============================================================
 * App 入口 — 组件树与数据流架构
 * ============================================================
 *
 * 【组件树】
 *   QueryClientProvider          ← React Query 的 Provider，全局共享缓存
 *     └─ AuthProvider            ← 认证状态（user / signIn / signOut）
 *          └─ BookProvider       ← 账本状态（currentBook / switchBook）
 *               └─ AuthGuard     ← 路由守卫（未登录 → 跳转登录页）
 *                    └─ 页面组件
 *
 * 【数据流】
 *   登录 → AuthProvider.setUser() → 各页面 useManualQuery 自动触发请求
 *   切换账本 → BookProvider.switchBook() → 存储新 bookId → 下次请求自动带上
 *
 * 【依赖说明】
 *   @tanstack/react-query: 提供 QueryClient（全局缓存）和 useMutation（增删改）
 *   数据获取: 使用自定义 useManualQuery（因为 useQuery 在 Taro 中兼容性问题）
 * ============================================================
 */
import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Taro, { useDidShow } from "@tarojs/taro";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BookProvider, useBookContext } from "./context/BookContext";
import { ThemeProvider } from "./context/ThemeContext";
import { hydrateAuthFromStorage } from "./services/api";
import { migrateSavedAccounts } from "./utils/savedAccounts";
import "./app.scss";

// T-C3: 在模块加载最早时机（Provider 挂载前）从 Storage 回填内存缓存
hydrateAuthFromStorage();
// T-C1: 启动时清理旧 saved_accounts 中的 password 字段
migrateSavedAccounts();

/**
 * QueryClient — React Query 的核心
 * 管理所有 useQuery/useMutation 的缓存和状态
 * defaultOptions: 全局默认配置
 *   - retry: 1       失败重试 1 次
 *   - staleTime: 30s  30 秒内不重新请求（认为数据还新鲜）
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

/** 不需要登录就能访问的页面 */
const AUTH_PAGE_PREFIXES = [
  "pages/User/Login",
  "pages/User/Register",
  "pages/User/ForgotPassword",
];

/**
 * OnboardingGate — 新用户引导守卫
 * 已登录 + 账本列表加载完成 + 无账本时，reLaunch 到引导页。
 * 老用户有 current_book_id 时直接放行（不等 books 异步加载）。
 * 若已在引导页但账本列表已加载出结果，自动跳回首页（避免卡死）。
 */
function OnboardingGate({ children }: PropsWithChildren<object>) {
  const { user, loading: authLoading } = useAuth();
  const { books, loading: booksLoading } = useBookContext();

  useEffect(() => {
    if (authLoading || !user) return;

    const pages = Taro.getCurrentPages();
    const currentPath =
      pages.length > 0 ? pages[pages.length - 1].route || "" : "";

    // 反向跳出：已在引导页、books 已加载完成、且已有账本 → 自动回首页
    if (currentPath === "pages/Onboarding/index" && !booksLoading && books.length > 0) {
      Taro.reLaunch({ url: "/pages/Home/index" });
      return;
    }

    // 老用户放行：服务端有 current_book_id 说明已有账本，不需等异步 books 列表
    if (user.current_book_id && !booksLoading) return;

    // books 还在加载中，暂不判断（避免竞态）
    if (booksLoading) return;

    // 无账本 → 跳引导页
    if (books.length === 0 && currentPath !== "pages/Onboarding/index") {
      Taro.reLaunch({ url: "/pages/Onboarding/index" });
    }
  }, [authLoading, booksLoading, user, books]);

  return <>{children}</>;
}

/**
 * AuthGuard — 全局登录守卫
 * 检查用户是否已登录，未登录则跳转到登录页
 * Taro 不允许 return null，所以始终渲染 children，
 * 由各页面自行判断 user 状态决定是否发请求
 */
function AuthGuard({ children }: PropsWithChildren<object>) {
  const { user, loading } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!loading) setChecked(true);
  }, [loading]);

  // 页面显示时检查登录状态
  useDidShow(() => {
    if (!loading && !user) {
      const pages = Taro.getCurrentPages();
      const currentPath =
        pages.length > 0 ? pages[pages.length - 1].route || "" : "";
      if (!AUTH_PAGE_PREFIXES.some((p) => currentPath.startsWith(p))) {
        Taro.reLaunch({ url: "/pages/User/Login/index" });
      }
    }
  });

  // 首次加载完成后检查
  useEffect(() => {
    if (checked && !user) {
      const pages = Taro.getCurrentPages();
      const currentPath =
        pages.length > 0 ? pages[pages.length - 1].route || "" : "";
      if (!AUTH_PAGE_PREFIXES.some((p) => currentPath.startsWith(p))) {
        Taro.reLaunch({ url: "/pages/User/Login/index" });
      }
    }
  }, [checked, user]);

  return <>{children}</>;
}

function App({ children }: PropsWithChildren<object>) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BookProvider>
            <AuthGuard>
              <OnboardingGate>{children}</OnboardingGate>
            </AuthGuard>
          </BookProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
