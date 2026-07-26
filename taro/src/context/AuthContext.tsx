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
  getToken,
  getRefreshToken,
  apiGet,
  apiPost,
  setStoredBookId,
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
import { invalidateManualQuery } from "../hooks/manualQueryCache";
import { API_PATHS } from "../utils/apiPaths";

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
          // profile 成功后同步资料 + 当前会话令牌，避免切号时读到过期 access
          if (userData?.email) {
            const liveAccess = getToken() || undefined;
            const liveRefresh = getRefreshToken() || undefined;
            updateAccountInfo(userData.email, {
              username: userData.username,
              avatar_url: userData.avatar_url,
              ...(liveAccess ? { token: liveAccess, accessToken: liveAccess } : {}),
              ...(liveRefresh ? { refreshToken: liveRefresh } : {}),
            });
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
    const targetAccess = (accessToken || "").trim();
    const targetRefresh = (refreshToken || "").trim();
    if (!targetAccess && !targetRefresh) {
      throw new Error("token_invalid");
    }

    // 先缓存当前会话，目标 token 校验失败时恢复，避免误登出当前账号
    const prevAccess = getToken();
    const prevRefresh = getRefreshToken() || "";
    const prevUser = user;

    // 离开当前账号前，把内存中最新双 token 写回独立 key / 列表，保证下次切回可用
    if (prevUser?.email && prevAccess) {
      setAccountToken(prevUser.email, prevAccess);
      if (prevRefresh) setAccountRefreshToken(prevUser.email, prevRefresh);
      updateAccountInfo(prevUser.email, {
        username: prevUser.username,
        avatar_url: prevUser.avatar_url,
      });
    }

    try {
      if (targetAccess) {
        // 有 access：先写入；若已过期，profile 401 会走 refresh 单飞续期
        storeTokens(targetAccess, targetRefresh);
      } else {
        // 仅 refresh：先换发 access，再拉 profile
        const tokens = await apiPost<{ accessToken: string; refreshToken: string }>(
          API_PATHS.auth.refresh,
          {
            data: { refreshToken: targetRefresh },
            silent: true,
            requiresAuth: false,
            _internalRefresh: true,
          },
        );
        storeTokens(tokens.accessToken, tokens.refreshToken || targetRefresh);
      }

      // silent：401 不跳登录页，错误直接抛出供回滚
      const profile = await apiGet<UserProfile>("/auth/profile", { silent: true });

      // 校验成功后再清业务状态；后续步骤失败不再回滚会话
      clearAddTransactionDraft();
      setStoredBookId(null);
      invalidateManualQuery(); // 清空模块级缓存，禁止 clear 以外的半残状态
      setUser(profile);

      const liveAccess = getToken() || targetAccess;
      const liveRefresh = getRefreshToken() || targetRefresh;
      if (liveAccess) setAccountToken(email, liveAccess);
      if (liveRefresh) setAccountRefreshToken(email, liveRefresh);
      updateAccountInfo(email, {
        username: profile.username,
        avatar_url: profile.avatar_url,
        ...(liveAccess ? { token: liveAccess, accessToken: liveAccess } : {}),
        ...(liveRefresh ? { refreshToken: liveRefresh } : {}),
      });
    } catch {
      // 仅目标会话建立失败时恢复当前账号
      if (prevAccess) {
        storeTokens(prevAccess, prevRefresh);
        setUser(prevUser);
      } else {
        clearStoredToken();
        setUser(null);
      }
      throw new Error("token_invalid");
    }
  }, [user]);

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
