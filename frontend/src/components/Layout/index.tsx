import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { Home, Plus, List, BarChart3, LogOut, User } from 'lucide-react'

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '交易记录', href: '/transactions', icon: List },
  { name: '统计报表', href: '/reports', icon: BarChart3 },
]

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-fg">家庭记账</h1>
              <span className="text-sm text-muted">家庭财务管理</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-fg">{user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="p-2 text-fg hover:bg-surface/50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-surface border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-fg hover:bg-surface/50 rounded-lg transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            <Link
              to="/add-transaction"
              className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>记一笔</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted">© 2024 家庭记账应用</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout