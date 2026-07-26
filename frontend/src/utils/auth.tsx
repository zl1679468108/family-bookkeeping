import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '@family-bookkeeping/shared-types';
import {
  clearStoredToken,
  getAccessToken,
  getProfile,
  getRefreshToken,
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
        // profile 成功后同步资料 + 当前会话令牌，避免切号时读到过期 access
        if (profile?.email) {
          const liveAccess = getAccessToken() || undefined;
          const liveRefresh = getRefreshToken() || undefined;
          updateAccountInfo(profile.email, {
            username: profile.username,
            avatar_url: profile.avatar_url,
            ...(liveAccess ? { token: liveAccess, accessToken: liveAccess } : {}),
            ...(liveRefresh ? { refreshToken: liveRefresh } : {}),
          });
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
    const targetAccess = (accessToken || '').trim();
    const targetRefresh = (refreshToken || '').trim();
    if (!targetAccess && !targetRefresh) {
      throw new Error('token_invalid');
    }

    // 先缓存当前会话，目标 token 校验失败时恢复，避免误登出当前账号
    const prevAccess = getAccessToken();
    const prevRefresh = getRefreshToken() || '';
    const prevProfile = queryClient.getQueryData<UserProfile | null>(queryKeys.auth.profile);

    // 离开当前账号前，把内存中最新双 token 写回 savedAccounts，保证下次切回可用
    if (prevProfile?.email && prevAccess) {
      updateAccountInfo(prevProfile.email, {
        token: prevAccess,
        accessToken: prevAccess,
        ...(prevRefresh ? { refreshToken: prevRefresh } : {}),
      });
    }

    // 取消进行中的旧账号请求，避免切 token 后旧请求回调污染状态
    await queryClient.cancelQueries();

    try {
      if (targetAccess) {
        // 有 access：先写入；若已过期，profile 401 会走 refresh 单飞续期
        storeTokens(targetAccess, targetRefresh);
      } else {
        // 仅 refresh：先换发 access，再拉 profile
        const tokens = await request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
          method: 'POST',
          body: { refreshToken: targetRefresh },
          silent: true,
          _internalRefresh: true,
        });
        storeTokens(tokens.accessToken.trim(), (tokens.refreshToken || targetRefresh).trim());
      }

      // 校验目标会话（silent：不 toast、不跳登录）
      const profile = await request<UserProfile>('/auth/profile', {
        requiresAuth: true,
        silent: true,
      });

      // 校验成功后再清业务缓存并写入 profile；后续步骤失败不再回滚会话
      resetUserCache();
      queryClient.setQueryData(queryKeys.auth.profile, profile);

      const liveAccess = getAccessToken() || targetAccess;
      const liveRefresh = getRefreshToken() || targetRefresh;
      updateAccountInfo(email, {
        ...(liveAccess ? { token: liveAccess, accessToken: liveAccess } : {}),
        ...(liveRefresh ? { refreshToken: liveRefresh } : {}),
        username: profile.username,
        avatar_url: profile.avatar_url,
      });

      // 二次拉取失败不回滚：本地 profile 已是目标账号
      await refetch().catch(() => undefined);
    } catch {
      // 仅目标会话建立失败时恢复当前账号
      if (prevAccess) {
        storeTokens(prevAccess, prevRefresh);
        if (prevProfile !== undefined) {
          queryClient.setQueryData(queryKeys.auth.profile, prevProfile);
        }
      } else {
        clearStoredToken();
        // 禁止 clear()：会与 profile 重取竞态；按 key 移除即可
        queryClient.removeQueries({ predicate: () => true });
      }
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
