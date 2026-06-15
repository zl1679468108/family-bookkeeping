import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  // 登录后重置所有与用户相关的缓存：账本 / 交易 / 预算等
  const resetUserCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  // 用 useQuery 管理 /auth/profile 请求，直接用 profileData 作为 user
  // 关键：不再经过额外的 useState 同步，避免渲染时序间隙导致误判登录状态
  const { data: profileData, isLoading: profileLoading, refetch, isFetched } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        return await getProfile();
      } catch (error) {
        // token 无效时清除
        clearStoredToken();
        return null;
      }
    },
    enabled: hasToken(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // user 直接从 profileData 派生：
  //  - 无 token → user = null，loading = false
  //  - 有 token 但 profile 还没返回 → user = null，loading = true
  //  - 有 token 且 profile 已返回 → user = profileData（可能是普通用户或 null），loading = false
  const user = profileData ?? null;
  const loading = hasToken() ? !isFetched : false;

  const refreshUser = async () => {
    await refetch();
  };

  const signIn = async (email: string, password: string) => {
    const { user: userData, token } = await apiLogin(email, password);
    storeToken(token.trim());
    resetUserCache(); // 切换账号时必须清除旧账号的缓存
    // 写入 query 缓存并触发 refetch 确保组件重新渲染
    queryClient.setQueryData(['auth', 'profile'], userData);
    await refetch();
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { user: userData, token } = await apiRegister(email, password, username);
    storeToken(token);
    resetUserCache(); // 新注册账号也需要清除旧缓存
    queryClient.setQueryData(['auth', 'profile'], userData);
    await refetch();
  };

  const signOut = useCallback(async () => {
    try {
      if (hasToken()) {
        await apiLogout().catch(() => undefined);
      }
    } finally {
      clearStoredToken();
      queryClient.setQueryData(['auth', 'profile'], null);
      resetUserCache();
    }
  }, [queryClient, resetUserCache]);

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
