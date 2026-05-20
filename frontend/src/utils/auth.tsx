import React, { createContext, useContext, useState, useEffect } from 'react'
import { checkHealth } from '../services/api'

interface AuthContextType {
  user: any
  loading: boolean
  isConnected: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await checkHealth()
        setIsConnected(connected)
        if (connected) {
          // 后端连接成功，设置默认用户
          setUser({ email: 'demo@example.com', id: 'demo-user' })
        }
      } catch (error) {
        console.error('后端连接失败:', error)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  const signIn = async (email: string, password: string) => {
    // TODO: 后端实现用户认证后，调用后端 API
    setUser({ email, id: 'demo-user' })
  }

  const signUp = async (email: string, password: string) => {
    // TODO: 后端实现用户认证后，调用后端 API
    setUser({ email, id: 'demo-user' })
  }

  const signOut = async () => {
    setUser(null)
  }

  const value = {
    user,
    loading,
    isConnected,
    signIn,
    signUp,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
