/**
 * PageLayout — 统一页面容器
 *
 * 自动处理 NavHeader + 内容区 + TabBar + 骨架屏 loading。
 *
 * Usage:
 *   <PageLayout title="首页" tabBar>
 *     {content}
 *   </PageLayout>
 *
 *   <PageLayout title="流水" tabBar rightContent={<搜索/>} loading={loading}>
 *     {content}
 *   </PageLayout>
 */
import { ReactNode } from "react";
import { View, ScrollView } from "@tarojs/components";
import NavHeader from "../NavHeader";
import PullRefresh from "../PullRefresh";
import TabBar from "../TabBar";
import "./index.scss";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  /** 是否显示 TabBar（一级页面） */
  tabBar?: boolean;
  /** 导航栏右侧内容 */
  rightContent?: ReactNode;
  /** 导航栏左侧内容 */
  leftContent?: ReactNode;
  /** 是否加载中，显示骨架屏 Fallback */
  loading?: boolean;
  /** 加载中提示文字 */
  loadingText?: string;
  /** 加载中的骨架屏内容，不传则用 PullRefresh */
  loadingFallback?: ReactNode;
  /** 外层容器 className（如 page-scoping class） */
  className?: string;
  /** 内容区 className（应用到滚动容器上） */
  contentClassName?: string;
  /** 是否使用 flex-1 + overflow 的滚动布局 */
  scrollable?: boolean;
  /** 滚动到底部回调（分页加载） */
  onScrollToLower?: () => void;
  /** 滚动阈值，默认 100 */
  lowerThreshold?: number;
}

export default function PageLayout({
  title,
  children,
  tabBar = false,
  rightContent,
  leftContent,
  loading = false,
  loadingText,
  loadingFallback,
  className = "",
  contentClassName = "",
  scrollable = true,
  onScrollToLower,
  lowerThreshold = 100,
}: PageLayoutProps) {
  const LoadingFallback = () => (
    <View>
      <PullRefresh loading text={loadingText || "加载中…"} />
      {loadingFallback}
    </View>
  );

  return (
    <View className={`min-h-screen bg-bg flex flex-col ${className}`}>
      <NavHeader
        title={title}
        leftContent={leftContent}
        rightContent={rightContent}
      />

      {loading ? (
        <LoadingFallback />
      ) : onScrollToLower ? (
        <ScrollView
          className={`flex-1 overflow-y-auto ${contentClassName}`}
          scrollY
          onScrollToLower={onScrollToLower}
          lowerThreshold={lowerThreshold}
        >
          {children}
        </ScrollView>
      ) : scrollable ? (
        <View className={`flex-1 overflow-y-auto ${contentClassName}`}>
          {children}
        </View>
      ) : (
        <View className={contentClassName}>{children}</View>
      )}

      {tabBar && <TabBar />}
    </View>
  );
}
