/**
 * 侧栏/路由预取：统一 query 预取 + 页面 chunk 预加载，避免 Sidebar 内联大块逻辑。
 */
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { queryClient } from './queryClient'
import { queryKeys } from './queryKeys'
import { GC_TIME_LONG, STALE } from './cachePolicy'
import { fetchSummary } from '../services/statisticsApi'
import { getTransactions } from '../services/api'
import { fetchBudgetStatus, fetchBudgets } from '../services/budgetsApi'
import { fetchCategories } from '../services/categoriesApi'
import { fetchTemplates } from '../services/templatesApi'
import {
  getAdminStats,
  getAdminUsers,
  getAdminTransactions,
  getAdminBooks,
} from '../services/adminApi'

export function prefetchRoute(path: string, bookId: string): void {
  const isAdminPath = path === '/admin' || path.startsWith('/admin/')
  if (!bookId && !isAdminPath) return

  // ── 管理后台（不依赖 bookId）──
  if (isAdminPath) {
    if (path === '/admin') {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.admin.stats,
        queryFn: getAdminStats,
        staleTime: STALE.admin,
      })
      void import('../pages/Admin/AdminDashboard')
    }
    if (path === '/admin/users') {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.admin.users(1, '', '', '', 20),
        queryFn: () => getAdminUsers({ page: 1, pageSize: 20 }),
        staleTime: STALE.admin,
      })
      void import('../pages/Admin/AdminUsers')
    }
    if (path === '/admin/transactions') {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.admin.usersForSelect,
        queryFn: () => getAdminUsers({ page: 1, pageSize: 1000 }),
        staleTime: STALE.admin,
      })
      void queryClient.prefetchQuery({
        queryKey: queryKeys.admin.booksForSelect,
        queryFn: () => getAdminBooks(),
        staleTime: STALE.admin,
      })
      void queryClient.prefetchQuery({
        queryKey: queryKeys.admin.transactions(1, '', '', '', '', 20),
        queryFn: () => getAdminTransactions({ page: 1, pageSize: 20 }),
        staleTime: STALE.admin,
      })
      void import('../pages/Admin/AdminTransactions')
    }
  }

  if (!bookId) return

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const today = format(now, 'yyyy-MM-dd')
  const monthKey = format(startOfMonth(now), 'yyyy-MM-dd')

  if (path === '/' || path === '/reports') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.statistics.summary(bookId, monthStart, monthEnd),
      queryFn: () => fetchSummary({ startDate: monthStart, endDate: monthEnd }),
      staleTime: STALE.statistics,
      gcTime: GC_TIME_LONG,
    })
  }

  if (path === '/' || path === '/transactions') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.recent(bookId, monthStart, monthEnd),
      queryFn: () => getTransactions({ pageSize: 5, startDate: monthStart, endDate: monthEnd }),
      staleTime: STALE.transactions,
    })
  }

  if (path === '/transactions') {
    const defaultListFilters = {
      type: '',
      category: '',
      startDate: '',
      endDate: today,
      search: '',
      minAmount: '',
      maxAmount: '',
      page: 1,
      pageSize: 20,
    }
    void queryClient.prefetchQuery({
      queryKey: queryKeys.transactions.list(bookId, defaultListFilters),
      queryFn: () => getTransactions({ page: 1, pageSize: 20, endDate: today }),
      staleTime: STALE.transactions,
    })
  }

  if (path === '/budgets') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.budgets.status(bookId, monthKey),
      queryFn: () => fetchBudgetStatus(monthKey),
      staleTime: STALE.budgets,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.budgets.list(bookId, monthKey),
      queryFn: () => fetchBudgets(monthKey),
      staleTime: STALE.budgets,
    })
  }

  if (path === '/categories') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list(bookId),
      queryFn: () => fetchCategories(),
      staleTime: STALE.categories,
    })
  }

  if (path === '/templates') {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.templates.list(bookId),
      queryFn: () => fetchTemplates(),
      staleTime: STALE.templates,
    })
  }

  if (path === '/reports') void import('../pages/Reports')
  if (path === '/transactions') void import('../pages/Transactions')
  if (path === '/map') void import('../pages/Map')
  if (path === '/calendar') void import('../pages/Calendar')
  if (path === '/add') void import('../pages/AddTransaction')
  if (path === '/budgets') void import('../pages/Budgets')
  if (path === '/categories') void import('../pages/Categories')
  if (path === '/templates') void import('../pages/Templates')
  if (path === '/annual-report') void import('../pages/AnnualReport')
  if (path === '/books') void import('../pages/Books')
}
