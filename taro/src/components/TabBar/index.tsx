/**
 * TabBar（1:1 严格按设计稿）
 *
 * ⚠️ custom-tab-bar 处于 React 组件树【外部】，CSS 变量可能不穿透，
 *    背景/边框/文字/图标色全部内联 hex（与 design tokens 对齐）。
 * 图标：单资源 + Icon color mask，不再维护 active/inactive 双套 Image。
 */
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import Icon, { IconName } from "../Icon";
import "./index.scss";

const THEME_STORAGE_KEY = "app_theme_mode";

function readIsDark(): boolean {
  try {
    return Taro.getStorageSync(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

function containerStyle(isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: isDark ? "#252825" : "#FFFFFF",
    borderTopColor: isDark ? "#3A3D39" : "#E0E2DD",
  };
}

function labelStyle(isActive: boolean, isDark: boolean): React.CSSProperties {
  if (isActive) {
    return { color: isDark ? "#45B7A7" : "#2D9D8A" };
  }
  return { color: isDark ? "#6E716C" : "#8B8E89" };
}

function iconColor(isActive: boolean, isDark: boolean): string {
  if (isActive) return isDark ? "#45B7A7" : "#2D9D8A";
  return isDark ? "#6E716C" : "#8B8E89";
}

const ITEMS: { path: string; label: string; icon: IconName }[] = [
  { path: "/pages/Home/index", label: "首页", icon: "home" },
  { path: "/pages/Transactions/index", label: "流水", icon: "transactions" },
  { path: "/pages/Workbench/index", label: "工作台", icon: "workbench" },
  { path: "/pages/Profile/index", label: "我的", icon: "profile" },
];

export default function TabBar() {
  const router = Taro.useRouter();
  const currentPath = router.path;
  const [isDark, setIsDark] = useState<boolean>(readIsDark);

  const isActive = (path: string) =>
    currentPath === path || currentPath.startsWith(path);

  const handleClick = (path: string) => {
    if (isActive(path)) return;
    Taro.switchTab({ url: path });
  };

  useEffect(() => {
    const onThemeChange = (payload: { theme?: string }) => {
      setIsDark(payload?.theme === "dark");
    };
    Taro.eventCenter.on("themeChange", onThemeChange);
    return () => {
      Taro.eventCenter.off("themeChange", onThemeChange);
    };
  }, []);

  return (
    <View className="tab-bar-container" style={containerStyle(isDark)}>
      {ITEMS.map((it) => {
        const active = isActive(it.path);
        return (
          <View
            key={it.path}
            className={`tab-bar-item ${active ? "tab-bar-item--active" : ""}`}
            onClick={() => handleClick(it.path)}
          >
            <Icon name={it.icon} size={44} color={iconColor(active, isDark)} />
            <Text className="tab-bar-label" style={labelStyle(active, isDark)}>
              {it.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
