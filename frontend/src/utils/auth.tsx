import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearStoredToken,
  getProfile,
  hasToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  storeToken,
  UserProfile,
} from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // 登录后重置所有与用户相关的缓存：账本 / 交易 / 预算等
  const resetUserCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!hasToken()) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getProfile();
        if (!cancelled) {
          setUser(userData);
        }
      } catch (error) {
        clearStoredToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: userData, token } = await apiLogin(email, password);
    storeToken(token.trim());
    resetUserCache(); // 关键：切换账号时必须清除旧账号的缓存
    setUser(userData);
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { user: userData, token } = await apiRegister(email, password, username);
    storeToken(token);
    resetUserCache(); // 新注册账号也需要清除旧缓存
    setUser(userData);
  };

  const signOut = useCallback(async () => {
    try {
      if (hasToken()) {
        await apiLogout().catch(() => undefined);
      }
    } finally {
      clearStoredToken();
      setUser(null);
      resetUserCache();
    }
  }, [resetUserCache]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
