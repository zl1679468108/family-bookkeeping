import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/ui/Icon'

export type NotificationType = 'success' | 'error' | 'info'

export interface NotificationItem {
  id: string
  type: NotificationType
  message: string
}

type NotifyInput = {
  type?: NotificationType
  message: string
}

type NotificationContextType = {
  notify: (input: NotifyInput) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)
const listeners = new Set<(notification: NotificationItem) => void>()

const nextId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const notify = ({ type = 'info', message }: NotifyInput): void => {
  const notification: NotificationItem = {
    id: nextId(),
    type,
    message,
  }

  listeners.forEach((listener) => listener(notification))
}

const toastStyleByType: Record<NotificationType, React.CSSProperties> = {
  error: {
    borderColor: 'color-mix(in srgb, var(--exp) 35%, transparent)',
    background: 'var(--expBg)',
    color: 'var(--exp)',
  },
  success: {
    borderColor: 'color-mix(in srgb, var(--inc) 35%, transparent)',
    background: 'var(--incBg)',
    color: 'var(--inc)',
  },
  info: {
    borderColor: 'var(--bd)',
    background: 'var(--srf)',
    color: 'var(--fg)',
  },
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  // 存储所有未触发的定时器 ID，组件卸载时统一清理（F-M9）
  const timersRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const timers = timersRef.current
    const handleAdd = (notification: NotificationItem) => {
      setNotifications((current) => [...current, notification])
      const timerId = window.setTimeout(() => {
        timers.delete(timerId)
        setNotifications((current) => current.filter((item) => item.id !== notification.id))
      }, 3000)
      timers.add(timerId)
    }

    listeners.add(handleAdd)
    return () => {
      listeners.delete(handleAdd)
      // 卸载时清理所有未触发的定时器
      timers.forEach((id) => window.clearTimeout(id))
      timers.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      notify,
    }),
    [],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 flex w-full max-w-sm flex-col gap-3 px-4 pointer-events-none"
        style={{ zIndex: 'var(--z-toast)' }}
      >
        {notifications.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all"
            style={toastStyleByType[item.type]}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-5 break-words whitespace-pre-wrap max-h-40 overflow-auto">{item.message}</p>
              <button
                type="button"
                onClick={() => setNotifications((current) => current.filter((notification) => notification.id !== item.id))}
                className="text-xs font-medium opacity-70 hover:opacity-100 shrink-0"
                aria-label="关闭通知"
                style={{ color: 'inherit' }}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
