import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { ThemeToggle } from '../../utils/theme'
import { BookSwitcher } from '../BookSwitcher'
import { Skeleton } from '../ui/Skeleton'
import './index.scss'

const NAV_ITEMS = [
  { id: 'dashboard', name: '概览', path: '/', icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z M3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z M11 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' },
  { id: 'add', name: '记一笔', path: '/add', icon: 'M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z' },
  { id: 'transactions', name: '交易记录', path: '/transactions', icon: 'M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1a1 1 0 000 2h6a1 1 0 100-2H7z M7 8a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H8a1 1 0 01-1-1V8z' },
  { id: 'reports', name: '统计报表', path: '/reports', icon: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z' },
  { id: 'annual-report', name: '年度报告', path: '/annual-report', icon: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z' },
  { id: 'map', name: '消费地图', path: '/map', icon: 'M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z' },
  { id: 'calendar', name: '现金流日历', path: '/calendar', icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' },
  { id: 'budgets', name: '预算管理', path: '/budgets', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
  { id: 'categories', name: '分类管理', path: '/categories', icon: 'M7 7h-.01M3 6a3 3 0 013-3h8a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V6z' },
  { id: 'templates', name: '交易模板', path: '/templates', icon: 'M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z' },
]

const COLLAPSED_KEY = 'sidebar_collapsed'

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, loading } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed))
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '64px' : '240px')
  }, [collapsed])

  // 点击外部关闭菜单
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const getActiveId = () => {
    const p = location.pathname
    if (p === '/') return 'dashboard'
    for (const item of NAV_ITEMS) {
      if (item.path !== '/' && p.startsWith(item.path)) return item.id
    }
    return 'dashboard'
  }
  const activeId = getActiveId()

  const handleLogout = async () => {
    try { await signOut(); navigate('/login') } catch (e) { console.error(e) }
  }

  const avatarChar = user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'
  const displayName = user?.username || '用户'
  const displayEmail = user?.email || ''

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">¥</div>
        {!collapsed && <span className="sidebar-logo-text">家庭记账</span>}
      </div>

      {/* 折叠按钮 */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? '展开' : '折叠'}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          {collapsed ? (
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          ) : (
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
          )}
        </svg>
      </button>

      {/* 账本切换 */}
      <div className="sidebar-book-area">
        <BookSwitcher />
      </div>

      {/* 导航 */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button key={item.id}
            className={`sidebar-nav-item${activeId === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.name : undefined}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="sidebar-nav-icon">
              <path fillRule="evenodd" d={item.icon} clipRule="evenodd"/>
            </svg>
            {!collapsed && <span className="sidebar-nav-label">{item.name}</span>}
          </button>
        ))}
      </nav>

      {/* 底部：个人中心 + 浮动菜单 */}
      <div className="sidebar-footer" ref={menuRef}>
        {loading || !user ? (
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
            <Skeleton width="36px" height="36px" borderRadius="50%" />
            {!collapsed && (
              <div style={{ marginLeft: '10px', flex: 1 }}>
                <Skeleton width="60px" height="14px" marginBottom="4px" />
                <Skeleton width="100px" height="12px" />
              </div>
            )}
          </div>
        ) : (
        <button className="sidebar-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="sidebar-user-avatar">{avatarChar}</div>
          {!collapsed && (
            <>
              <span className="sidebar-user-name">{displayName}</span>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className={`sidebar-user-arrow${menuOpen ? ' open' : ''}`} style={{ marginLeft: 'auto' }}>
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </>
          )}
        </button>
        )}

        {/* 浮动菜单 */}
        {menuOpen && (
          <div className="sidebar-user-menu">
            <div className="user-menu-header">
              <div className="user-menu-avatar">{avatarChar}</div>
              <div className="user-menu-info">
                <div className="user-menu-name">{displayName}{' '}✓</div>
                <div className="user-menu-email">{displayEmail}</div>
              </div>
            </div>
            <div className="user-menu-divider" />
            <div className="user-menu-section">
              <ThemeToggle />
            </div>
            <div className="user-menu-divider" />
            <button className="user-menu-item" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
              </svg>
              退出登录
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
