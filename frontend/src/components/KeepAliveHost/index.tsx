import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './index.scss'

/** 仅缓存重型页面，避免全站 KeepAlive 占内存 */
export const KEEP_ALIVE_PATHS = ['/map', '/calendar'] as const

const MAX_ALIVE = 3

const MapPage = lazy(() => import('../../pages/Map'))
const CalendarPage = lazy(() => import('../../pages/Calendar'))

const PAGE_MAP: Record<(typeof KEEP_ALIVE_PATHS)[number], React.LazyExoticComponent<React.ComponentType>> = {
  '/map': MapPage,
  '/calendar': CalendarPage,
}

export function isKeepAlivePath(pathname: string): boolean {
  return (KEEP_ALIVE_PATHS as readonly string[]).includes(pathname)
}

/**
 * 路由级 KeepAlive：访问过的地图/日历页隐藏保留，再次进入不销毁。
 * 挂载处请传 key={userId}，登出/切账号时整体卸载。
 */
export const KeepAliveHost: React.FC = () => {
  const location = useLocation()
  const [visited, setVisited] = useState<string[]>([])

  useEffect(() => {
    const path = location.pathname
    if (!isKeepAlivePath(path)) return

    setVisited((prev) => {
      const without = prev.filter((p) => p !== path)
      const next = [...without, path]
      if (next.length > MAX_ALIVE) {
        return next.slice(next.length - MAX_ALIVE)
      }
      return next
    })
  }, [location.pathname])

  // 地图从 hidden 恢复时触发 resize，避免瓦片/容器尺寸错乱
  useEffect(() => {
    if (location.pathname !== '/map') return
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 80)
    return () => window.clearTimeout(timer)
  }, [location.pathname, visited])

  return (
    <>
      {visited.map((path) => {
        const Comp = PAGE_MAP[path as (typeof KEEP_ALIVE_PATHS)[number]]
        if (!Comp) return null
        const active = location.pathname === path
        return (
          <div
            key={path}
            className={
              active
                ? 'keep-alive-page keep-alive-page--active'
                : 'keep-alive-page keep-alive-page--hidden'
            }
            data-keep-alive-path={path}
            aria-hidden={!active}
          >
            <Suspense fallback={null}>
              <Comp />
            </Suspense>
          </div>
        )
      })}
    </>
  )
}

export default KeepAliveHost
