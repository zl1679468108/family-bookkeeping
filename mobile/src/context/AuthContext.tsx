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
} from 'react';
import { hasToken, storeToken, clearStoredToken } from '../services/api';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getProfile,
} from '../services/authApi';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: userData, token } = await apiLogin(email, password);
    storeToken(token);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Hook to access auth context */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
