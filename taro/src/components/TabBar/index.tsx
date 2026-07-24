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
import { NAV_HOME, NAV_TRANSACTIONS, NAV_WORKBENCH, NAV_PROFILE } from "../../utils/navCopy";
import { STORAGE_THEME_TARO } from "../../utils/storageKeys";
import { getThemeTokenHex } from "../../utils/themeTokens";
import "./index.scss";
import { buildTabBarItemClassName } from "../../utils/tabBar";

const THEME_STORAGE_KEY = STORAGE_THEME_TARO;

function readIsDark(): boolean {
  try {
    return Taro.getStorageSync(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

function containerStyle(isDark: boolean): React.CSSProperties {
  const hex = getThemeTokenHex(isDark);
  return {
    backgroundColor: hex.srf,
    borderTopColor: hex.bd,
  };
}

function labelStyle(isActive: boolean, isDark: boolean): React.CSSProperties {
  const hex = getThemeTokenHex(isDark);
  return { color: isActive ? hex.pr : hex.fg3 };
}

function iconColor(isActive: boolean, isDark: boolean): string {
  const hex = getThemeTokenHex(isDark);
  return isActive ? hex.pr : hex.fg3;
}

const ITEMS: { path: string; label: string; icon: IconName }[] = [
  { path: "/pages/Home/index", label: NAV_HOME, icon: "home" },
  { path: "/pages/Transactions/index", label: NAV_TRANSACTIONS, icon: "transactions" },
  { path: "/pages/Workbench/index", label: NAV_WORKBENCH, icon: "workbench" },
  { path: "/pages/Profile/index", label: NAV_PROFILE, icon: "profile" },
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
            className={buildTabBarItemClassName({ active })}
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
