import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'app_theme';
const THEME_ATTR = 'data-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getStoredTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage 不可用时忽略
  }
  return 'system';
};

const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme);
  const resolvedRef = useRef<ResolvedTheme>(resolveTheme(getStoredTheme()));

  const resolvedTheme = resolvedRef.current;

  // 同步 data-theme 属性到 document 根元素
  useEffect(() => {
    document.documentElement.setAttribute(THEME_ATTR, resolvedTheme);
  }, [resolvedTheme]);

  // 监听系统主题变化（仅在 theme === 'system' 时生效）
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
      resolvedRef.current = newResolved;
      document.documentElement.setAttribute(THEME_ATTR, newResolved);
      // 强制重渲染
      setThemeState('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // localStorage 不可用时忽略
    }
    const newResolved = resolveTheme(mode);
    resolvedRef.current = newResolved;
    document.documentElement.setAttribute(THEME_ATTR, newResolved);
    setThemeState(mode);
  }, []);

  // 初始化时设置 data-theme
  useEffect(() => {
    const resolved = resolveTheme(theme);
    resolvedRef.current = resolved;
    document.documentElement.setAttribute(THEME_ATTR, resolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/** 主题切换组件（三段式：浅色 / 暗色 / 跟随系统） */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const modes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: '浅色', icon: <Sun size={16} /> },
    { value: 'dark', label: '暗色', icon: <Moon size={16} /> },
    { value: 'system', label: '跟随系统', icon: <Monitor size={16} /> },
  ];

  const currentIndex = modes.findIndex((m) => m.value === theme);
  const nextMode = modes[(currentIndex + 1) % modes.length];

  const handleClick = () => {
    setTheme(nextMode.value);
  };

  const currentMode = modes[currentIndex];

  return (
    <button
      className="theme-toggle"
      onClick={handleClick}
      title={`当前: ${currentMode.label}，点击切换为 ${nextMode.label}`}
      aria-label={`切换主题，当前为${currentMode.label}`}
    >
      {currentMode.icon}
      <span className="theme-toggle-label">{currentMode.label}</span>
    </button>
  );
};
