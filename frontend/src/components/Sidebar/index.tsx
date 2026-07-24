import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { ThemeToggle } from '../../utils/theme'
import { Skeleton } from '../ui/Skeleton'
import { Icon, type IconName } from '../ui/Icon'
import { userDisplayName, userInitial } from '../../utils/userDisplay'
import SwitchAccountModal from '../SwitchAccountModal'
import { useQuery } from '@tanstack/react-query'
import { fetchBudgetStatus } from '../../services/budgetsApi'
import { useBook } from '../../hooks/useBook'
import { format, startOfMonth } from 'date-fns'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import './index.scss'
import { queryKeys } from '../../utils/queryKeys'
import { prefetchRoute as prefetchBookRoute } from '../../utils/prefetchRoute'
import { STALE } from '../../utils/cachePolicy'

const NAV_ITEMS = [
  { id: 'dashboard', name: '首页', path: '/', type: 'normal', group: 'main' as const },
  { id: 'transactions', name: '流水', path: '/transactions', type: 'normal', group: 'main' as const },
  { id: 'add', name: '记一笔', path: '/add', type: 'add', group: 'main' as const },
  { id: 'reports', name: '报表', path: '/reports', type: 'normal', group: 'main' as const },
  { id: 'calendar', name: '日历', path: '/calendar', type: 'normal', group: 'main' as const },
  { id: 'map', name: '地图', path: '/map', type: 'normal', group: 'main' as const },
  { id: 'annual-report', name: '年报', path: '/annual-report', type: 'normal', group: 'main' as const },
  { id: 'books', name: '账本', path: '/books', type: 'normal', group: 'main' as const },
  { id: 'categories', name: '分类', path: '/categories', type: 'normal', group: 'main' as const },
  { id: 'templates', name: '模板', path: '/templates', type: 'normal', group: 'main' as const },
  { id: 'budgets', name: '预算', path: '/budgets', type: 'normal', group: 'main' as const },
];

const ADMIN_ITEMS = [
  { id: 'admin-dashboard', name: '数据看板', path: '/admin', type: 'normal' },
  { id: 'admin-users', name: '用户管理', path: '/admin/users', type: 'normal' },
  { id: 'admin-transactions', name: '交易监控', path: '/admin/transactions', type: 'normal' },
]

const COLLAPSED_KEY = 'sidebar_collapsed'

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, loading } = useAuth()
  const { run: handleLogout, isRunning: logoutLoading } = useDebouncedAction(async () => {
    try { await signOut(); navigate('/login') } catch (e) { console.error(e) }
  })
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
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
    const allItems = [...NAV_ITEMS, ...ADMIN_ITEMS]
    let matchedItem = null
    let maxLength = 0
    for (const item of allItems) {
      if (item.path !== '/' && p.startsWith(item.path)) {
        if (item.path.length > maxLength) {
          maxLength = item.path.length
          matchedItem = item
        }
      }
    }
    return matchedItem?.id || 'dashboard'
  }
  const activeId = getActiveId()

  const handleProfile = () => {
    setMenuOpen(false)
    navigate('/profile')
  }

  const displayName = userDisplayName(user)
  const displayEmail = user?.email || ''
  const avatarChar = userInitial(user, 'U')

  // 获取预算状态，计算超预算数量
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const { hasBooks, currentBook } = useBook()
  const bookId = currentBook?.id || ''
  const { data: budgetStatus } = useQuery({
    queryKey: queryKeys.budgets.status(bookId, currentMonth),
    queryFn: () => fetchBudgetStatus(currentMonth),
    enabled: !collapsed && hasBooks && !!bookId,
    staleTime: STALE.budgets,
  })

  const prefetchRoute = (path: string) => {
    const isAdminPath = path === '/admin' || path.startsWith('/admin/')
    if (!isAdminPath && (!bookId || !hasBooks)) return
    prefetchBookRoute(path, bookId)
  }

  const overBudgetCount = budgetStatus?.categories?.filter(c => c.status === 'over').length || 0

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo — 静记 */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">静</div>
        {!collapsed && <span className="sidebar-logo-text">静记</span>}
      </div>

      {/* 折叠按钮 */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? '展开' : '折叠'}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          {collapsed ? (
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          )}
        </svg>
      </button>

      {/* 导航 */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-nav-sep">主菜单</div>}
        {NAV_ITEMS.map((item) => (
          <button key={item.id}
            className={`sidebar-nav-item${activeId === item.id ? ' active' : ''}${item.type === 'add' ? ' sidebar-nav-item--add' : ''}`}
            onClick={() => navigate(item.path)}
            onMouseEnter={() => prefetchRoute(item.path)}
            onFocus={() => prefetchRoute(item.path)}
            title={collapsed ? item.name : undefined}>
            <span className="sidebar-nav-icon">
              <Icon name={item.id as IconName} size={16} />
            </span>
            {!collapsed && <span className="sidebar-nav-label">{item.name}</span>}
            {item.id === 'budgets' && !collapsed && overBudgetCount >= 1 && (
              <span className="sidebar-nav-badge" id="budgetBadge">{overBudgetCount > 99 ? '99+' : overBudgetCount}</span>
            )}
          </button>
        ))}
        {/* 管理员菜单 */}
        {user?.role === 'admin' && (
          <>
            {!collapsed && <div className="sidebar-nav-sep">管理后台</div>}
            {ADMIN_ITEMS.map((item) => (
              <button key={item.id}
                className={`sidebar-nav-item${activeId === item.id ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => prefetchRoute(item.path)}
                onFocus={() => prefetchRoute(item.path)}
                title={collapsed ? item.name : undefined}>
                <span className="sidebar-nav-icon">
                  <Icon name={item.id as IconName} size={16} />
                </span>
                {!collapsed && <span className="sidebar-nav-label">{item.name}</span>}
              </button>
            ))}
          </>
        )}
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
            <div className="sidebar-user-avatar">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                avatarChar
              )}
            </div>
            {!collapsed && (
              <>
                <span className="sidebar-user-name">{displayName}</span>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className={`sidebar-user-arrow${menuOpen ? ' open' : ''}`} style={{ marginLeft: 'auto' }}>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        )}

        {/* 浮动菜单 */}
        {menuOpen && (
          <div className="sidebar-user-menu">
            <div className="user-menu-header">
              <div className="user-menu-avatar">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  avatarChar
                )}
              </div>
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
            <button className="user-menu-item" onClick={handleProfile}>
              <Icon name="user" size={16} />
              个人信息
            </button>
            <button className="user-menu-item" onClick={() => { setMenuOpen(false); setShowSwitchModal(true) }}>
              <Icon name="users" size={16} />
              切换账号
            </button>
            <button className="user-menu-item" onClick={() => { setMenuOpen(false); navigate('/about') }}>
              <Icon name="info" size={16} />
              关于静记
            </button>
            <div className="user-menu-divider" />
            <button className="user-menu-item user-menu-item--danger" onClick={handleLogout} disabled={logoutLoading}>
              <Icon name="logout" size={16} />
              {logoutLoading ? '退出中...' : '退出登录'}
            </button>
          </div>
        )}
      </div>

      {/* 切换账号弹窗：条件渲染避免不必要的初始化（F-L9） */}
      {showSwitchModal && (
        <SwitchAccountModal
          visible={showSwitchModal}
          onClose={() => setShowSwitchModal(false)}
        />
      )}
    </aside>
  )
}

export default Sidebar
