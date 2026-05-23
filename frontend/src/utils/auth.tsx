import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { checkHealth, login as apiLogin, register as apiRegister, getProfile, logout as apiLogout } from '../services/api'

interface AuthContextType {
  user: any
  loading: boolean
  isConnected: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // 检查后端连接
      const connected = await checkHealth()
      setIsConnected(connected)
      
      if (connected) {
        // 尝试获取用户信息
        await refreshUser()
      }
    } catch (error) {
      console.error('认证初始化失败:', error)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const userData = await getProfile()
      setUser(userData)
    } catch (error) {
      // 获取用户信息失败，可能是未登录或 token 过期
      setUser(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { user: userData } = await apiLogin(email, password)
      setUser(userData)
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { user: userData } = await apiRegister(email, password, username)
      setUser(userData)
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      apiLogout()
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    isConnected,
    signIn,
    signUp,
    signOut,
    refreshUser
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
