import { QueryClient } from '@tanstack/react-query'
import { GC_TIME, STALE } from './cachePolicy'

/** 全局唯一 QueryClient，供 Provider 与 Sidebar 预取共用 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.default,
      gcTime: GC_TIME,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
})
