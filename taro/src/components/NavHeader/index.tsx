/**
 * NavHeader — 统一导航栏组件
 *
 * 三栏布局，标题始终居中，左右插槽等宽。
 * 自动处理 safe area + 胶囊按钮避让，固定高度 88rpx。
 *
 * Usage:
 *   <NavHeader title="首页" />
 *   <NavHeader title="流水" rightContent={<搜索/>} />
 *   <NavHeader title="记一笔" leftContent={<关闭/>} rightContent={<模板/>} />
 */
import { ReactNode, useMemo } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";

interface NavHeaderProps {
  title: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export default function NavHeader({
  title,
  leftContent,
  rightContent,
}: NavHeaderProps) {
  const statusBarH = Taro.getWindowInfo?.()?.statusBarHeight || 44;

  // 计算胶囊按钮避让：右侧预留胶囊宽度+间距
  const capsuleRight = useMemo(() => {
    try {
      const menu = Taro.getMenuButtonBoundingClientRect();
      const windowW = Taro.getWindowInfo?.()?.windowWidth || 375;
      if (menu && windowW) {
        // 胶囊右侧到屏幕右边缘的距离（px → rpx）
        const rightGapPx = windowW - menu.right;
        const capsuleWidthPx = menu.width;
        // 右侧 slot 需要避开：胶囊宽度 + 胶囊右边距 + 额外间距
        return (rightGapPx + capsuleWidthPx + 8) * (750 / windowW);
      }
    } catch {}
    return 180; // fallback: 约 87px 胶囊 + 间距
  }, []);

  return (
    <View className="nav-header" style={{ paddingTop: `${statusBarH}px` }}>
      <View className="nav-header-row">
        {/* Left slot — fixed width */}
        <View className="nav-header-slot nav-header-slot--left">
          {leftContent}
        </View>

        {/* Title — centered */}
        <Text className="nav-header-title" numberOfLines={1}>
          {title}
        </Text>

        {/* Right slot — capsule-safe */}
        <View
          className="nav-header-slot nav-header-slot--right"
          style={{ right: `${capsuleRight}rpx` }}
        >
          {rightContent}
        </View>
      </View>
    </View>
  );
}
