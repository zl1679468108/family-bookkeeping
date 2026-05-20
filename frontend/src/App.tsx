import React, { Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar'
import { routes } from './routes'

const queryClient = new QueryClient()

const AuthContext = React.createContext<{ user: any; loading: boolean }>({ user: null, loading: false })

const AuthProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<any>({ email: 'demo@example.com', id: 'demo-user' })
  const [loading, setLoading] = React.useState(false)

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-bg">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

interface AppProps {
  children?: React.ReactNode
}

const App: React.FC<AppProps> = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProviderComponent>
        <Router>
          <div className="app">
            <Sidebar />
            <main className="main">
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-bg">Loading...</div>}>
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
        </Router>
      </AuthProviderComponent>
    </QueryClientProvider>
  )
}

export default App