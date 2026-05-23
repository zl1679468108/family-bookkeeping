import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import './index.scss'

interface NavItem {
  id: string
  name: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    name: '概览',
    path: '/',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm8-1a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
      </svg>
    )
  },
  {
    id: 'transactions',
    name: '交易记录',
    path: '/transactions',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
        <path d="M7 8a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1V8z"/>
      </svg>
    )
  },
  {
    id: 'reports',
    name: '统计报表',
    path: '/reports',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
      </svg>
    )
  },
  {
    id: 'add',
    name: '记一笔',
    path: '/add',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
      </svg>
    )
  }
]

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  const getActiveItemId = () => {
    const path = location.pathname
    if (path === '/') return 'dashboard'
    if (path === '/transactions') return 'transactions'
    if (path === '/reports') return 'reports'
    if (path === '/add') return 'add'
    return 'dashboard'
  }

  const activeItemId = getActiveItemId()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">¥</div>
        <span>家庭记账</span>
      </div>
      
      <div className="user-info">
        <div className="user-avatar">
          {user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
        </div>
        <div className="user-details">
          <div className="user-name">{user?.username || '用户'}</div>
          <div className="user-email">{user?.email || '未设置邮箱'}</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeItemId === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.name}
          </button>
        ))}
        
        <button
          className="nav-item logout-button"
          onClick={handleLogout}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
          </svg>
          退出登录
        </button>
      </nav>
    </aside>
  )
}