/**
 * useNavBarTheme — 让微信原生导航栏（标题栏）跟随暗色主题
 *
 * 原生导航栏不吃 CSS 变量，只能通过 Taro.setNavigationBarColor 控制。
 *
 * ⚠️ 关键约束（经过多次迭代验证的结论）：
 *   1. switchTab / 页面切换时，微信会把导航栏重置为 app.config.ts 的默认配置色（白色）
 *   2. 因此不能用"全局幂等"跳过调用——必须每次页面显示都重新确认
 *   3. 不能用 animation 参数——即使同色重复设置，有 animation 也会产生视觉跳动
 *   4. setNavigationBarColor 是同步原生 API，同值重复调用开销 ≈ 0
 *
 * 使用位置：PageLayout（覆盖全部 Tab 页面）+ 5 个独立页面。
 */
import { useEffect } from "react";
import Taro, { useDidShow } from "@tarojs/taro";

const THEME_STORAGE_KEY = "app_theme_mode";

function readIsDark(): boolean {
  try {
    return Taro.getStorageSync(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

/** 同步设置导航栏配色（无动画、无条件） */
function applyNavBarColor(isDark: boolean) {
  try {
    Taro.setNavigationBarColor({
      frontColor: isDark ? "#ffffff" : "#000000",
      backgroundColor: isDark ? "#1A1C19" : "#FFFFFF",
    });
  } catch {
    // 个别基础库版本异常时静默忽略
  }
}

export function useNavBarTheme() {
  // 挂载时立即应用（读 Storage，不等 Context 异步回填）
  useEffect(() => {
    applyNavBarColor(readIsDark());

    // 监听主题切换事件（用户在「我的」页切换开关时触发）
    const onThemeChange = (payload: { theme?: string }) => {
      applyNavBarColor(payload?.theme === "dark");
    };
    Taro.eventCenter.on("themeChange", onThemeChange);
    return () => {
      Taro.eventCenter.off("themeChange", onThemeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 每次 useDidShow 都重新确认（switchTab 后微信一定重置了导航栏，必须补设）
  useDidShow(() => {
    applyNavBarColor(readIsDark());
  });
}
