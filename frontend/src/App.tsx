import React, { Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { routes } from './routes'
import { AuthProvider, useAuth } from './utils/auth'
import { ThemeProvider } from './utils/theme'
import { BookProvider } from './hooks/useBook'
import { hasToken } from './services/api'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // token 存在但用户信息还在加载中 → 展示空骨架，不跳转
  if (loading && hasToken()) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }} />
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }} />
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
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }} />}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }} />
    )
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Suspense fallback={<div style={{ padding: '32px' }}>
          <div style={{ height: '32px', width: '30%', borderRadius: '8px', marginBottom: '24px', background: 'linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s ease-in-out infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '24px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '120px', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', padding: '24px' }}>
                <div style={{ width: '60%', height: '14px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s ease-in-out infinite', marginBottom: '12px' }} />
                <div style={{ width: '80%', height: '28px', borderRadius: '8px', background: 'linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '56px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%)', backgroundSize: '200% 100%', animation: 'skeletonShimmer 1.5s ease-in-out infinite', marginBottom: '8px' }} />
          ))}
        </div>}>
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
