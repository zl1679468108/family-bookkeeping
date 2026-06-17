import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearStoredToken,
  getProfile,
  hasToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  request,
  storeToken,
  UserProfile,
} from '../services/api';
import { saveAccount, updateAccountInfo } from './savedAccounts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaId: string, captchaCode: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** 通过已存储的 token 切换账号，token 失效则抛错 */
  switchByToken: (email: string, token: string) => Promise<void>;
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
  const { data: profileData, refetch, isFetched } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        const profile = await getProfile();
        // profile 获取成功后更新已保存账号的用户名和头像
        if (profile?.email) {
          updateAccountInfo(profile.email, { username: profile.username, avatar_url: profile.avatar_url });
        }
        return profile;
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

  /** 通过已存储的 token 切换账号（token 有效则直接切换，失效则抛错由调用方处理） */
  const switchByToken = async (email: string, token: string) => {
    storeToken(token);
    try {
      // 先用新 token 验证并获取 profile（silent 模式：不显示 toast、不跳转）
      const profile = await request<UserProfile>('/auth/profile', {
        requiresAuth: true,
        silent: true,
      });

      // 移除所有缓存查询（不触发自动重取，避免 clear() 导致的竞态问题）
      // 下次渲染时，mounted 的 useQuery 会自动重建并用新 token 获取数据
      queryClient.removeQueries();

      // 设置新用户的 profile 数据（创建新查询，后续 useQuery 同步时使用）
      queryClient.setQueryData(['auth', 'profile'], profile);

      // 切换成功：同步更新 savedAccounts 中该账号的 token、用户名、头像
      updateAccountInfo(email, {
        token,
        username: profile.username,
        avatar_url: profile.avatar_url,
      });
    } catch {
      // token 失效，清除并抛错
      clearStoredToken();
      queryClient.removeQueries();
      throw new Error('token_invalid');
    }
  };

  const signIn = async (email: string, password: string, captchaId: string, captchaCode: string) => {
    const { user: userData, token } = await apiLogin(email, password, captchaId, captchaCode);
    storeToken(token.trim());
    saveAccount({ email, token: token.trim(), username: userData.username, avatar_url: userData.avatar_url });
    resetUserCache();
    queryClient.setQueryData(['auth', 'profile'], userData);
    await refetch();
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { user: userData, token } = await apiRegister(email, password, username);
    storeToken(token);
    saveAccount({ email, username: userData.username, avatar_url: userData.avatar_url });
    resetUserCache();
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
    switchByToken,
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
