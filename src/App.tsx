import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar/Sidebar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import AddTransaction from './pages/AddTransaction'

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
              <Routes>
                <Route path="/login" element={<div>Login Page (to be implemented)</div>} />
                <Route path="/signup" element={<div>Signup Page (to be implemented)</div>} />
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <PrivateRoute>
                      <Transactions />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <PrivateRoute>
                      <Reports />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/add" 
                  element={
                    <PrivateRoute>
                      <AddTransaction />
                    </PrivateRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProviderComponent>
    </QueryClientProvider>
  )
}

export default App