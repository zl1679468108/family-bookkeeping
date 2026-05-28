import React, { Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { routes } from './routes'
import { AuthProvider, useAuth } from './utils/auth'
import { ThemeProvider } from './utils/theme'
import { hasToken } from './services/api'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // token 存在但用户信息还在加载中 → 展示空骨架，不跳转
  if (loading && hasToken()) {
    return <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400">加载中...</div>
    </div>
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-gray-500">加载中...</div>
    </div>
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

// 公开路由（登录/注册/忘记密码），不渲染侧边栏
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'] as const

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  const isAuthPage = AUTH_ROUTES.includes(location.pathname as any)

  // 公开路由 → 不渲染侧边栏，直接展示页面
  if (isAuthPage) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50">加载中...</div>}>
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
  if (!hasToken() && !loading) {
    return <Navigate to="/login" replace />
  }

  const showLayout = hasToken() || Boolean(user)

  // 加载中 → 不展示侧边栏
  if (!showLayout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50">加载中...</div>}>
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
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
