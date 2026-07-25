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
import { currentMonthKey } from '../../utils/month'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import './index.scss'
import { queryKeys } from '../../utils/queryKeys'
import { prefetchRoute as prefetchBookRoute } from '../../utils/prefetchRoute'
import { STALE } from '../../utils/cachePolicy'
import { NAV_HOME, NAV_TRANSACTIONS, NAV_ADD, NAV_REPORTS, NAV_CALENDAR, NAV_MAP, NAV_ANNUAL_REPORT, NAV_BOOKS, NAV_CATEGORIES, NAV_TEMPLATES, NAV_BUDGETS, NAV_ADMIN_DASHBOARD, NAV_ADMIN_USERS, NAV_ADMIN_TRANSACTIONS, NAV_SECTION_MAIN, NAV_SECTION_ADMIN } from '../../utils/navCopy'
import { ACTION_LOGOUT, ACTION_LOGGING_OUT, ACTION_SWITCH_ACCOUNT,
  collapseToggleLabel,
} from '../../utils/actionCopy'
import { TITLE_ABOUT } from '../../utils/sectionCopy'
import {
  buildSidebarClassName,
  buildSidebarNavItemClassName,
  buildSidebarUserArrowClassName,
  buildUserMenuItemClassName,
} from '../../utils/sidebar'
import { APP_NAME, APP_BRAND_MARK } from '../../config/version'
import { reportClientError } from '../../utils/clientDiagnostics'

const NAV_ITEMS = [
  { id: 'dashboard', name: NAV_HOME, path: '/', type: 'normal', group: 'main' as const },
  { id: 'transactions', name: NAV_TRANSACTIONS, path: '/transactions', type: 'normal', group: 'main' as const },
  { id: 'add', name: NAV_ADD, path: '/add', type: 'add', group: 'main' as const },
  { id: 'reports', name: NAV_REPORTS, path: '/reports', type: 'normal', group: 'main' as const },
  { id: 'calendar', name: NAV_CALENDAR, path: '/calendar', type: 'normal', group: 'main' as const },
  { id: 'map', name: NAV_MAP, path: '/map', type: 'normal', group: 'main' as const },
  { id: 'annual-report', name: NAV_ANNUAL_REPORT, path: '/annual-report', type: 'normal', group: 'main' as const },
  { id: 'books', name: NAV_BOOKS, path: '/books', type: 'normal', group: 'main' as const },
  { id: 'categories', name: NAV_CATEGORIES, path: '/categories', type: 'normal', group: 'main' as const },
  { id: 'templates', name: NAV_TEMPLATES, path: '/templates', type: 'normal', group: 'main' as const },
  { id: 'budgets', name: NAV_BUDGETS, path: '/budgets', type: 'normal', group: 'main' as const },
];

const ADMIN_ITEMS = [
  { id: 'admin-dashboard', name: NAV_ADMIN_DASHBOARD, path: '/admin', type: 'normal' },
  { id: 'admin-users', name: NAV_ADMIN_USERS, path: '/admin/users', type: 'normal' },
  { id: 'admin-transactions', name: NAV_ADMIN_TRANSACTIONS, path: '/admin/transactions', type: 'normal' },
]

const COLLAPSED_KEY = 'sidebar_collapsed'

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, loading } = useAuth()
  const { run: handleLogout, isRunning: logoutLoading } = useDebouncedAction(async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (e) {
      reportClientError('Sidebar.signOut', e)
    }
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
  const currentMonth = currentMonthKey()
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
    <aside className={buildSidebarClassName({ collapsed })}>
      {/* Logo — 静记 */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">{APP_BRAND_MARK}</div>
        {!collapsed && <span className="sidebar-logo-text">{APP_NAME}</span>}
      </div>

      {/* 折叠按钮 */}
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}
        title={collapseToggleLabel(collapsed)}>
        <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={18} />
      </button>

      {/* 导航 */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-nav-sep">{NAV_SECTION_MAIN}</div>}
        {NAV_ITEMS.map((item) => (
          <button key={item.id}
            className={buildSidebarNavItemClassName({ active: activeId === item.id, add: item.type === 'add' })}
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
            {!collapsed && <div className="sidebar-nav-sep">{NAV_SECTION_ADMIN}</div>}
            {ADMIN_ITEMS.map((item) => (
              <button key={item.id}
                className={buildSidebarNavItemClassName({ active: activeId === item.id })}
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
                <Icon name="chevron-down" size={14} className={buildSidebarUserArrowClassName({ open: menuOpen })} />
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
            <button className={buildUserMenuItemClassName()} onClick={handleProfile}>
              <Icon name="user" size={16} />
              个人信息
            </button>
            <button className={buildUserMenuItemClassName()} onClick={() => { setMenuOpen(false); setShowSwitchModal(true) }}>
              <Icon name="users" size={16} />
              {ACTION_SWITCH_ACCOUNT}
            </button>
            <button className={buildUserMenuItemClassName()} onClick={() => { setMenuOpen(false); navigate('/about') }}>
              <Icon name="info" size={16} />
              {TITLE_ABOUT}
            </button>
            <div className="user-menu-divider" />
            <button className={buildUserMenuItemClassName({ danger: true })} onClick={handleLogout} disabled={logoutLoading}>
              <Icon name="logout" size={16} />
              {logoutLoading ? ACTION_LOGGING_OUT : ACTION_LOGOUT}
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
