import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './index.scss'

/**
 * 仅缓存「无第三方地图实例」的重页面。
 * 地图页不走 KeepAlive：AMap 在 display:none 下尺寸为 0，且 skipResizeObserver
 * 会导致瓦片空白；地图实例复用已由 AmapManager 池负责。
 */
export const KEEP_ALIVE_PATHS = ['/calendar'] as const

const MAX_ALIVE = 2

const CalendarPage = lazy(() => import('../../pages/Calendar'))

const PAGE_MAP: Record<(typeof KEEP_ALIVE_PATHS)[number], React.LazyExoticComponent<React.ComponentType>> = {
  '/calendar': CalendarPage,
}

export function isKeepAlivePath(pathname: string): boolean {
  return (KEEP_ALIVE_PATHS as readonly string[]).includes(pathname)
}

export const KeepAliveHost: React.FC = () => {
  const location = useLocation()
  const path = location.pathname

  const [visited, setVisited] = useState<string[]>(() =>
    isKeepAlivePath(path) ? [path] : [],
  )

  const renderPaths = useMemo(() => {
    if (!isKeepAlivePath(path)) return visited
    if (visited.includes(path)) return visited
    const next = [...visited, path]
    return next.length > MAX_ALIVE ? next.slice(next.length - MAX_ALIVE) : next
  }, [path, visited])

  useEffect(() => {
    if (!isKeepAlivePath(path)) return
    setVisited((prev) => {
      if (prev.includes(path)) {
        return [...prev.filter((p) => p !== path), path]
      }
      const next = [...prev, path]
      return next.length > MAX_ALIVE ? next.slice(next.length - MAX_ALIVE) : next
    })
  }, [path])

  return (
    <>
      {renderPaths.map((keepPath) => {
        const Comp = PAGE_MAP[keepPath as (typeof KEEP_ALIVE_PATHS)[number]]
        if (!Comp) return null
        const active = path === keepPath
        return (
          <div
            key={keepPath}
            className={
              active
                ? 'keep-alive-page keep-alive-page--active'
                : 'keep-alive-page keep-alive-page--hidden'
            }
            data-keep-alive-path={keepPath}
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
