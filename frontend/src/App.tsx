import React, { Suspense, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { routes } from './routes'
import { AuthProvider, useAuth } from './utils/auth'
import { ThemeProvider } from './utils/theme'
import { BookProvider, useBook } from './hooks/useBook'
import { hasToken } from './services/api'

const PROJECT_NAME = '静记'

// 当用户已登录但没有账本时允许访问的路由（引导性页面）
const NO_BOOK_ALLOWED = ['/onboarding', '/books', '/profile'] as const

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'] as const

const AppLayout: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const { hasBooks, loading: booksLoading } = useBook()
  const location = useLocation()

  useEffect(() => {
    document.title = PROJECT_NAME
  }, [location.pathname])

  const isAuthPage = AUTH_ROUTES.includes(location.pathname as any)

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

  // token 不存在且未加载中 → 跳转登录
  if (!hasToken() && !authLoading) {
    return <Navigate to="/login" replace />
  }

  const isAllowedWithoutBooks = NO_BOOK_ALLOWED.includes(location.pathname as any)

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
      <main className="main" style={hideSidebar ? { marginLeft: 0 } : undefined}>
        <Suspense fallback={null}>
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.isPrivate ? (
                    <PrivateRoute>
                      {route.element}
                    </PrivateRoute>
                  ) : (
                    route.element
                  )
                }
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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
