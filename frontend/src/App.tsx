import React, { Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar'
import { routes } from './routes'
import { AuthProvider, useAuth } from './utils/auth'

const queryClient = new QueryClient()

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

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

const AppLayout: React.FC = () => {
  const { user } = useAuth()

  // 未登录时不显示侧边栏
  if (!user) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50">加载中...</div>}>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App