import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../utils/auth'
import { ThemeToggle } from '../../utils/theme'
import { Skeleton } from '../ui/Skeleton'
import SwitchAccountModal from '../SwitchAccountModal'
import { useQuery } from '@tanstack/react-query'
import { fetchBudgetStatus } from '../../services/budgetsApi'
import { useBook } from '../../hooks/useBook'
import { format, startOfMonth } from 'date-fns'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import './index.scss'

// SVG 图标组件 - 直接定义SVG元素，与设计稿一致
const Icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  transactions: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
    </svg>
  ),
  add: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  budgets: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  'annual-report': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  books: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  templates: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  categories: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  map: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'dashboard', name: '首页', path: '/', type: 'normal', group: 'main' as const },
  { id: 'transactions', name: '流水', path: '/transactions', type: 'normal', group: 'main' as const },
  { id: 'add', name: '记一笔', path: '/add', type: 'add', group: 'main' as const },
  { id: 'reports', name: '报表', path: '/reports', type: 'normal', group: 'main' as const },
  { id: 'calendar', name: '日历', path: '/calendar', type: 'normal', group: 'main' as const },
  { id: 'map', name: '地图', path: '/map', type: 'normal', group: 'main' as const },
  { id: 'annual-report', name: '年报', path: '/annual-report', type: 'normal', group: 'main' as const },
  { id: 'books', name: '账本', path: '/books', type: 'normal', group: 'more' as const },
  { id: 'categories', name: '分类', path: '/categories', type: 'normal', group: 'more' as const },
  { id: 'templates', name: '模板', path: '/templates', type: 'normal', group: 'more' as const },
  { id: 'budgets', name: '预算', path: '/budgets', type: 'normal', group: 'more' as const },
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

  const displayName = user?.username || '用户'
  const displayEmail = user?.email || ''
  const avatarChar = (() => {
    const name = user?.username || user?.email || '用户'
    const chineseChar = name.match(/[\u4e00-\u9fa5]/)
    if (chineseChar) return chineseChar[0]
    return name.charAt(0).toUpperCase() || 'U'
  })()

  // 获取预算状态，计算超预算数量
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const { hasBooks } = useBook()
  const { data: budgetStatus } = useQuery({
    queryKey: ['budgets', 'status', currentMonth],
    queryFn: () => fetchBudgetStatus(currentMonth),
    enabled: !collapsed && hasBooks, // 只在展开时且已有账本时获取数据
  })
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
        {/* 主菜单：通过 group 字段筛选，避免硬编码切片（F-L8） */}
        {!collapsed && <div className="sidebar-nav-sep">主菜单</div>}
        {NAV_ITEMS.filter((item) => item.group === 'main').map((item) => (
          <button key={item.id}
            className={`sidebar-nav-item${activeId === item.id ? ' active' : ''}${item.type === 'add' ? ' sidebar-nav-item--add' : ''}`}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.name : undefined}>
            <span className="sidebar-nav-icon">
              {Icons[item.id as keyof typeof Icons]}
            </span>
            {!collapsed && <span className="sidebar-nav-label">{item.name}</span>}
            {item.id === 'budgets' && !collapsed && overBudgetCount >= 1 && (
              <span className="sidebar-nav-badge" id="budgetBadge">{overBudgetCount > 99 ? '99+' : overBudgetCount}</span>
            )}
          </button>
        ))}
        {/* 更多：通过 group 字段筛选 */}
        {!collapsed && <div className="sidebar-nav-sep">更多</div>}
        {NAV_ITEMS.filter((item) => item.group === 'more').map((item) => (
          <button key={item.id}
            className={`sidebar-nav-item${activeId === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.name : undefined}>
            <span className="sidebar-nav-icon">
              {Icons[item.id as keyof typeof Icons]}
            </span>
            {!collapsed && <span className="sidebar-nav-label">{item.name}</span>}
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
                title={collapsed ? item.name : undefined}>
                <span className="sidebar-nav-icon">
                  {Icons[item.id === 'admin-dashboard' ? 'dashboard' : item.id === 'admin-users' ? 'books' : 'transactions']}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              个人信息
            </button>
            <button className="user-menu-item" onClick={() => { setMenuOpen(false); setShowSwitchModal(true) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              切换账号
            </button>
            <div className="user-menu-divider" />
            <button className="user-menu-item user-menu-item--danger" onClick={handleLogout} disabled={logoutLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
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
