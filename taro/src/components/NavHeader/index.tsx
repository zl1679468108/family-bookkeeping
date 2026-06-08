/**
 * NavHeader — 统一导航栏组件
 *
 * 三栏布局，标题始终居中，左右插槽等宽。
 * 自动处理 safe area，固定高度 88rpx。
 *
 * Usage:
 *   <NavHeader title="首页" />
 *   <NavHeader title="流水" rightContent={<搜索/>} />
 *   <NavHeader title="记一笔" leftContent={<关闭/>} rightContent={<模板/>} />
 */
import { ReactNode } from "react";
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

        {/* Right slot — fixed width */}
        <View className="nav-header-slot nav-header-slot--right">
          {rightContent}
        </View>
      </View>
    </View>
  );
}
