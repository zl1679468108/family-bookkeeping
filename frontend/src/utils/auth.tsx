import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@family-bookkeeping/shared-types';
import {
  clearStoredToken,
  getProfile,
  hasToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  request,
  storeTokens,
  ApiError,
} from '../services/api';
import { saveAccount, updateAccountInfo } from './savedAccounts';
import { queryKeys, USER_SCOPED_ROOT_KEYS, removeQueryRoots } from './queryKeys';
import { clearAddTransactionDraft } from './addTransactionDraft';
import { STALE } from './cachePolicy';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaId: string, captchaCode: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** 通过已存储的 token 切换账号，token 失效则抛错 */
  switchByToken: (email: string, accessToken: string, refreshToken?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // 登录后重置所有与用户相关的缓存：账本 / 交易 / 预算等
  const resetUserCache = useCallback(() => {
    removeQueryRoots(queryClient, USER_SCOPED_ROOT_KEYS);
    clearAddTransactionDraft();
  }, [queryClient]);

  // 用 useQuery 管理 /auth/profile 请求，直接用 profileData 作为 user
  // 关键：不再经过额外的 useState 同步，避免渲染时序间隙导致误判登录状态
  const { data: profileData, refetch, isFetched } = useQuery({
    queryKey: queryKeys.auth.profile,
    staleTime: STALE.authProfile,
    queryFn: async () => {
      try {
        const profile = await getProfile();
        // profile 获取成功后更新已保存账号的用户名和头像
        if (profile?.email) {
          updateAccountInfo(profile.email, { username: profile.username, avatar_url: profile.avatar_url });
        }
        return profile;
      } catch (error) {
        // 仅 401 时清除 token；其他错误（503/504/网络）应抛出，让 React Query 处理重试
        if (error instanceof ApiError && error.statusCode === 401) {
          clearStoredToken();
        }
        throw error;
      }
    },
    enabled: hasToken(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      // 401 不 retry；其他错误最多 retry 2 次
      if (error instanceof ApiError && error.statusCode === 401) return false;
      return failureCount < 2;
    },
  });

  // user 直接从 profileData 派生：
  //  - 无 token → user = null，loading = false
  //  - 有 token 但 profile 还没返回 → user = null，loading = true
  //  - 有 token 且 profile 已返回 → user = profileData（可能是普通用户或 null），loading = false
  const user = profileData ?? null;
  const loading = hasToken() ? !isFetched : false;

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /** 通过已存储的 token 切换账号（token 有效则直接切换，失效则抛错由调用方处理） */
  const switchByToken = useCallback(async (email: string, accessToken: string, refreshToken?: string) => {
    // 同时设置当前会话的 access + refresh；profile 401 时自动刷新会用 refresh 续期
    if (accessToken) storeTokens(accessToken.trim(), (refreshToken || '').trim());
    try {
      // 先用新 token 验证并获取 profile（silent 模式：不显示 toast、不跳转）
      const profile = await request<UserProfile>('/auth/profile', {
        requiresAuth: true,
        silent: true,
      });

      // 与 signIn 保持一致：先清空所有缓存，再设置 profile 并 refetch
      // 避免 removeQueries 触发级联 refetch 时旧 token 残留导致 token 被清
      resetUserCache();
      queryClient.setQueryData(queryKeys.auth.profile, profile);

      // 切换成功：同步更新 savedAccounts 中该账号的 token、用户名、头像
      updateAccountInfo(email, {
        token: accessToken.trim(),
        accessToken: accessToken.trim(),
        refreshToken: (refreshToken || '').trim(),
        username: profile.username,
        avatar_url: profile.avatar_url,
      });

      // 强制刷新 profile query，确保各组件拿到最新 user 数据
      await refetch();
    } catch {
      // token 失效，清除并抛错
      clearStoredToken();
      queryClient.removeQueries({ predicate: () => true });
      throw new Error('token_invalid');
    }
  }, [queryClient, refetch, resetUserCache]);

  const signIn = useCallback(async (email: string, password: string, captchaId: string, captchaCode: string) => {
    const { user: userData, accessToken, refreshToken } = await apiLogin(email, password, captchaId, captchaCode);
    storeTokens(accessToken.trim(), refreshToken.trim());
    saveAccount({
      email,
      token: accessToken.trim(),
      accessToken: accessToken.trim(),
      refreshToken: refreshToken.trim(),
      username: userData.username,
      avatar_url: userData.avatar_url,
    });
    resetUserCache();
    queryClient.setQueryData(queryKeys.auth.profile, userData);
    await refetch();
  }, [queryClient, refetch, resetUserCache]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { user: userData, accessToken, refreshToken } = await apiRegister(email, password, username);
    storeTokens(accessToken.trim(), refreshToken.trim());
    saveAccount({
      email,
      token: accessToken.trim(),
      accessToken: accessToken.trim(),
      refreshToken: refreshToken.trim(),
      username: userData.username,
      avatar_url: userData.avatar_url,
    });
    resetUserCache();
    queryClient.setQueryData(queryKeys.auth.profile, userData);
    await refetch();
  }, [queryClient, refetch, resetUserCache]);

  const signOut = useCallback(async () => {
    try {
      if (hasToken()) {
        await apiLogout().catch(() => undefined);
      }
    } finally {
      clearStoredToken();
      queryClient.setQueryData(queryKeys.auth.profile, null);
      resetUserCache();
    }
  }, [queryClient, resetUserCache]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    switchByToken,
  }), [user, loading, signIn, signUp, signOut, refreshUser, switchByToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
