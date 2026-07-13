/**
 * ThemeContext — 主题切换（亮色 / 暗色）
 *
 * 通过 Taro.setStorageSync/getStorageSync 持久化偏好。
 * 切换时通过 Taro.eventCenter 发布事件通知各页面更新。
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Taro from "@tarojs/taro";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "app_theme_mode";

/** 从 Storage 读取主题偏好，默认亮色 */
function getStoredTheme(): ThemeMode {
  try {
    const stored = Taro.getStorageSync(THEME_STORAGE_KEY);
    if (stored === "dark") return "dark";
  } catch {
    // ignore
  }
  return "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      Taro.setStorageSync(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
    // 发布事件（PageLayout 已通过 useTheme 响应式获取最新值）
    try {
      Taro.eventCenter.trigger("themeChange", { theme: mode });
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, isDark: theme === "dark", toggleTheme, setTheme }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Hook to access theme context */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
