import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const handleAdd = (notification: NotificationItem) => {
      setNotifications((current) => [...current, notification])
      window.setTimeout(() => {
        setNotifications((current) => current.filter((item) => item.id !== notification.id))
      }, 3000)
    }

    listeners.add(handleAdd)
    return () => {
      listeners.delete(handleAdd)
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
      <div className="fixed top-4 right-4 z-[3000] flex w-full max-w-sm flex-col gap-3 px-4 pointer-events-none">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all ${
              item.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : item.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-5 break-words whitespace-pre-wrap max-h-40 overflow-auto">{item.message}</p>
              <button
                type="button"
                onClick={() => setNotifications((current) => current.filter((notification) => notification.id !== item.id))}
                className="text-xs font-medium opacity-70 hover:opacity-100"
                aria-label="关闭通知"
              >
                ×
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
