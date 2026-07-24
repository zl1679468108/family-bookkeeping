/**
 * Auth context — provides user state and auth methods to the entire app.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  hasToken,
  storeTokens,
  clearStoredToken,
  apiGet,
} from "../services/api";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getProfile,
} from "../services/authApi";
import {
  saveAccount,
  updateAccountInfo,
  setAccountToken,
  setAccountRefreshToken,
} from "../utils/savedAccounts";
import type { UserProfile } from "../types";
import { clearAddTransactionDraft } from "../utils/addTransactionDraft";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Initialize auth on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        if (hasToken()) {
          const userData = await getProfile();
          // profile 获取成功后更新已保存账号的用户名和头像
          if (userData?.email) {
            updateAccountInfo(userData.email, { username: userData.username, avatar_url: userData.avatar_url });
          }
          setUser(userData);
        }
      } catch {
        clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
    } catch {
      setUser(null);
      clearStoredToken();
    }
  }, []);

  /** 通过已存储的 token 切换账号（token 有效则直接切换，失效则抛错由调用方处理） */
  const switchByToken = useCallback(async (email: string, accessToken: string, refreshToken?: string) => {
    // 同时设置当前会话的 access + refresh；profile 401 时自动刷新会用 refresh 续期
    if (accessToken) storeTokens(accessToken, refreshToken || "");
    try {
      // 用 silent 模式：401 不跳转登录页，错误直接抛出
      const profile = await apiGet<UserProfile>("/auth/profile", { silent: true });
      setUser(profile);
      // 切换成功：token 独立持久化（T-C1），用户名/头像同步到 saved_accounts
      if (accessToken) setAccountToken(email, accessToken);
      if (refreshToken) setAccountRefreshToken(email, refreshToken);
      updateAccountInfo(email, {
        username: profile.username,
        avatar_url: profile.avatar_url,
      });
    } catch {
      // token 失效，清除并抛错
      clearStoredToken();
      setUser(null);
      throw new Error("token_invalid");
    }
  }, []);

  const signIn = useCallback(async (email: string, _password: string, captchaId: string, captchaCode: string) => {
    const { user: userData, accessToken, refreshToken } = await apiLogin(email, _password, captchaId, captchaCode);
    storeTokens(accessToken, refreshToken);
    // T-C1: 仅存储 token，不再存储密码
    saveAccount({
      email,
      token: accessToken,
      accessToken,
      refreshToken,
      username: userData.username,
      avatar_url: userData.avatar_url,
    });
    setUser(userData);
  }, []);

  const signUp = useCallback(
    async (email: string, _password: string, username: string) => {
      const { user: userData, accessToken, refreshToken } = await apiRegister(
        email,
        _password,
        username,
      );
      storeTokens(accessToken, refreshToken);
      // T-C1: 仅存储 token，不再存储密码
      saveAccount({
        email,
        token: accessToken,
        accessToken,
        refreshToken,
        username: userData.username,
        avatar_url: userData.avatar_url,
      });
      setUser(userData);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      if (hasToken()) {
        await apiLogout().catch(() => {});
      }
    } finally {
      clearAddTransactionDraft();
      clearStoredToken();
      setUser(null);
    }
  }, []);

  // 关键：缓存 Provider value 避免每次渲染生成新对象导致全量重渲染
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser,
      switchByToken,
    }),
    [user, loading, signIn, signUp, signOut, refreshUser, switchByToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook to access auth context */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
