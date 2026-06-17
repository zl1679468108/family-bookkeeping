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
} from "react";
import {
  hasToken,
  storeToken,
  clearStoredToken,
  apiGet,
} from "../services/api";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getProfile,
} from "../services/authApi";
import { saveAccount, updateAccountInfo } from "../utils/savedAccounts";
import type { UserProfile } from "../types";

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
  const switchByToken = useCallback(async (email: string, token: string) => {
    storeToken(token);
    try {
      // 用 silent 模式：401 不跳转登录页，错误直接抛出
      const profile = await apiGet<UserProfile>("/auth/profile", { silent: true });
      setUser(profile);
      // 切换成功：同步更新 savedAccounts 中该账号的 token、用户名、头像
      updateAccountInfo(email, {
        token,
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

  const signIn = useCallback(async (email: string, password: string, captchaId: string, captchaCode: string) => {
    const { user: userData, token } = await apiLogin(email, password, captchaId, captchaCode);
    storeToken(token);
    // 登录成功后保存账号信息（token 优先，密码备用）
    saveAccount({ email, password, token, username: userData.username, avatar_url: userData.avatar_url });
    setUser(userData);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      const { user: userData, token } = await apiRegister(
        email,
        password,
        username,
      );
      storeToken(token);
      // 注册成功后也保存账号信息
      saveAccount({ email, password, username: userData.username, avatar_url: userData.avatar_url });
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
      clearStoredToken();
      setUser(null);
    }
  }, []);

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

/** Hook to access auth context */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
