import React, { Suspense, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { routes } from './routes'
import { AuthProvider, useAuth } from './utils/auth'
import { ThemeProvider } from './utils/theme'
import { BookProvider, useBook } from './hooks/useBook'
import { hasToken } from './services/api'
import { PageProgressBar } from './components/PageProgressBar'

const PROJECT_NAME = '静记'

// 路由 → 页面标题映射（F-L2）
const PAGE_TITLES: Record<string, string> = {
  '/': `首页 - ${PROJECT_NAME}`,
  '/transactions': `交易流水 - ${PROJECT_NAME}`,
  '/add': `记一笔 - ${PROJECT_NAME}`,
  '/reports': `报表 - ${PROJECT_NAME}`,
  '/calendar': `日历 - ${PROJECT_NAME}`,
  '/map': `地图 - ${PROJECT_NAME}`,
  '/annual-report': `年度账单 - ${PROJECT_NAME}`,
  '/books': `账本 - ${PROJECT_NAME}`,
  '/categories': `分类 - ${PROJECT_NAME}`,
  '/templates': `模板 - ${PROJECT_NAME}`,
  '/budgets': `预算 - ${PROJECT_NAME}`,
  '/profile': `个人中心 - ${PROJECT_NAME}`,
  '/onboarding': `开始使用 - ${PROJECT_NAME}`,
  '/admin': `管理后台 - ${PROJECT_NAME}`,
  '/admin/users': `用户管理 - ${PROJECT_NAME}`,
  '/admin/transactions': `交易监控 - ${PROJECT_NAME}`,
  '/login': `登录 - ${PROJECT_NAME}`,
  '/register': `注册 - ${PROJECT_NAME}`,
  '/forgot-password': `找回密码 - ${PROJECT_NAME}`,
}

// 当用户已登录但没有账本时允许访问的路由（引导性页面）
const NO_BOOK_ALLOWED: string[] = ['/onboarding', '/books', '/profile']

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // T-L11: 显示加载状态，避免白屏
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--fg3)' }}>加载中...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

// 管理员路由：仅 role === 'admin' 可访问，否则重定向到首页
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const AUTH_ROUTES: string[] = ['/login', '/register', '/forgot-password']

const AppLayout: React.FC = () => {
  const { user } = useAuth()
  const { hasBooks, loading: booksLoading } = useBook()
  const location = useLocation()

  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] || PROJECT_NAME
  }, [location.pathname])

  const isAuthPage = AUTH_ROUTES.includes(location.pathname)

  // 公开路由（登录/注册/忘记密码）→ 不渲染侧边栏
  if (isAuthPage) {
    return (
      <Suspense fallback={null}>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  // token 不存在 → 跳转登录（authLoading 在 hasToken() 为 false 时一定为 false，无需额外判断 F-L3）
  if (!hasToken()) {
    return <Navigate to="/login" replace />
  }

  const isAllowedWithoutBooks = NO_BOOK_ALLOWED.includes(location.pathname)

  // 已登录且账本列表已加载，但没有任何账本 → 引导到 onboarding
  if (user && !booksLoading && !hasBooks && !isAllowedWithoutBooks) {
    return <Navigate to="/onboarding" replace />
  }

  // 已登录有账本，但用户自己跑到 /onboarding → 直接回首页
  if (user && hasBooks && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }


  // onboarding 和 /books 也不显示侧边栏（避免不必要的请求）
  const hideSidebar = location.pathname === '/onboarding'

  return (
    <div className="app">
      {!hideSidebar && <Sidebar />}
      <main className="main" style={hideSidebar ? { marginLeft: 0, maxWidth: '100%', padding: 0, height: '100vh', overflow: 'hidden' } : undefined}>
        <ErrorBoundary>
          <Suspense fallback={null}>
            <Routes>
              {routes.map((route) => {
                const isAdminRoute = route.path.startsWith('/admin')
                const element = isAdminRoute ? (
                  <AdminRoute>{route.element}</AdminRoute>
                ) : route.isPrivate ? (
                  <PrivateRoute>
                    {route.element}
                  </PrivateRoute>
                ) : (
                  route.element
                )
                return (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={element}
                  />
                )
              })}
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}

interface AppProps {
  children?: React.ReactNode
}

const App: React.FC<AppProps> = () => {
  return (
    <ThemeProvider>
      <PageProgressBar />
      <AuthProvider>
        <BookProvider>
          <Router>
            <AppLayout />
          </Router>
        </BookProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
