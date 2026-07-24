import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
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
 *
 * 注意：当前 keep-alive 路径必须在首帧就进入渲染列表，
 * 不能只靠 useEffect 追加，否则 `Routes` 已跳过 + visited 为空会白屏一帧/永久白屏。
 */
export const KeepAliveHost: React.FC = () => {
  const location = useLocation()
  const path = location.pathname

  const [visited, setVisited] = useState<string[]>(() =>
    isKeepAlivePath(path) ? [path] : [],
  )

  // 渲染期合并：保证当前 keep-alive 路径首帧可见
  const renderPaths = useMemo(() => {
    if (!isKeepAlivePath(path)) return visited
    if (visited.includes(path)) return visited
    const next = [...visited, path]
    return next.length > MAX_ALIVE ? next.slice(next.length - MAX_ALIVE) : next
  }, [path, visited])

  // 提交到 state，离开后仍保留实例
  useEffect(() => {
    if (!isKeepAlivePath(path)) return
    setVisited((prev) => {
      if (prev.includes(path)) {
        // LRU：移到末尾
        return [...prev.filter((p) => p !== path), path]
      }
      const next = [...prev, path]
      return next.length > MAX_ALIVE ? next.slice(next.length - MAX_ALIVE) : next
    })
  }, [path])

  // 地图从 hidden 恢复时触发 resize，避免瓦片/容器尺寸错乱
  useEffect(() => {
    if (path !== '/map') return
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => window.clearTimeout(timer)
  }, [path, renderPaths])

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
