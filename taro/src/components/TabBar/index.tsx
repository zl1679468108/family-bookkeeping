/**
 * TabBar（1:1 严格按设计稿）
 *
 * ⚠️ custom-tab-bar 处于 React 组件树【外部】且是微信原生自定义组件，
 *    存在组件样式隔离，app.scss .theme-dark 下的 CSS 变量可能无法穿透。
 *    因此背景/边框/文字色全部通过【内联 style】直接设置，不依赖 SCSS 继承。
 *
 * 图标仍走 class（图标颜色不需要跟随主题变化）。
 */
import { View, Text, Image } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import "./index.scss";

const THEME_STORAGE_KEY = "app_theme_mode";

/** 从 Storage 同步当前是否暗色 */
function readIsDark(): boolean {
  try {
    return Taro.getStorageSync(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

/** 根据主题返回容器内联样式（背景 + 边框） */
function containerStyle(isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: isDark ? "#252825" : "#FFFFFF",
    borderTopColor: isDark ? "#3A3D39" : "#E0E2DD",
  };
}

/** 根据主题返回 tab item 文字颜色 */
function labelStyle(isActive: boolean, isDark: boolean): React.CSSProperties {
  if (isActive) {
    // 对齐 design tokens：亮色 --pr，暗色更亮一档 --pr(#45B7A7)
    return { color: isDark ? "#45B7A7" : "#2D9D8A" };
  }
  return { color: isDark ? "#6E716C" : "#8B8E89" };
}

export default function TabBar() {
  const router = Taro.useRouter();
  const currentPath = router.path;
  // 初始值直接读 Storage（custom-tab-bar 在树外，取不到 ThemeContext）
  const [isDark, setIsDark] = useState<boolean>(readIsDark);

  const isActive = (path: string) =>
    currentPath === path || currentPath.startsWith(path);

  const handleClick = (path: string) => {
    if (isActive(path)) return;
    Taro.switchTab({ url: path });
  };

  // 监听全局主题切换事件
  useEffect(() => {
    const onThemeChange = (payload: { theme?: string }) => {
      setIsDark(payload?.theme === "dark");
    };
    Taro.eventCenter.on("themeChange", onThemeChange);
    return () => {
      Taro.eventCenter.off("themeChange", onThemeChange);
    };
  }, []);

  const items = [
    {
      path: "/pages/Home/index",
      label: "首页",
      active: require("../../assets/icons/home.svg"),
      inactive: require("../../assets/icons/home-gray.svg"),
    },
    {
      path: "/pages/Transactions/index",
      label: "流水",
      active: require("../../assets/icons/transactions.svg"),
      inactive: require("../../assets/icons/transactions-gray.svg"),
    },
    {
      path: "/pages/Workbench/index",
      label: "工作台",
      active: require("../../assets/icons/workbench.svg"),
      inactive: require("../../assets/icons/workbench-gray.svg"),
    },
    {
      path: "/pages/Profile/index",
      label: "我的",
      active: require("../../assets/icons/profile.svg"),
      inactive: require("../../assets/icons/profile-gray.svg"),
    },
  ];

  return (
    <View className="tab-bar-container" style={containerStyle(isDark)}>
      {items.map((it) => {
        const active = isActive(it.path);
        return (
          <View
            key={it.path}
            className={`tab-bar-item ${active ? "tab-bar-item--active" : ""}`}
            onClick={() => handleClick(it.path)}
          >
            <Image
              className="tab-bar-icon"
              src={active ? it.active : it.inactive}
              mode="aspectFit"
            />
            <Text className="tab-bar-label" style={labelStyle(active, isDark)}>
              {it.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
