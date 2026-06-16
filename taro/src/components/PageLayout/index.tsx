/**
 * PageLayout — 统一页面容器（使用系统默认导航栏）
 *
 * 不再渲染自定义 NavHeader，由微信系统导航栏承担标题显示。
 * 负责：下拉刷新、上拉加载、骨架屏 loading、内容容器，支持 header（吸顶插槽）。
 *
 * Usage:
 *   <PageLayout>{content}</PageLayout>
 *   <PageLayout onRefresh={handleRefresh} refreshing={refreshing}>
 *     {content}
 *   </PageLayout>
 *   <PageLayout onLoadMore={handleLoadMore} hasMore={hasMore} loading={loading}>
 *     {content}
 *   </PageLayout>
 *   <PageLayout header={<FilterBar/>}>{content}</PageLayout>
 */
import { ReactNode, useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import PullRefresh from "../PullRefresh";
import "./index.scss";

interface PageLayoutProps {
  children: ReactNode;
  /** 吸顶头部（渲染在滚动容器外部，会在下拉刷新外） */
  header?: ReactNode;
  /** 是否加载中，显示骨架屏 Fallback */
  loading?: boolean;
  /** 加载中提示文字 */
  loadingText?: string;
  /** 外层容器 className */
  className?: string;
  /** 内容区 className */
  contentClassName?: string;
  /** 是否使用 flex-1 + overflow 的滚动布局（默认 true） */
  scrollable?: boolean;
  /** 下拉刷新回调；传入时开启下拉刷新能力 */
  onRefresh?: () => Promise<void> | void;
  /** 是否处于下拉刷新中（受控） */
  refreshing?: boolean;
  /** 上拉加载更多回调；传入时开启上拉加载能力 */
  onLoadMore?: () => Promise<void> | void;
  /** 是否还有更多（无更多则不再触发 onLoadMore） */
  hasMore?: boolean;
  /** 正在加载更多时（受控） */
  loadingMore?: boolean;
  /** 上拉加载阈值（距底部多少 rpx 触发） */
  lowerThreshold?: number;
}

export default function PageLayout({
  children,
  header,
  loading = false,
  loadingText,
  className = "",
  contentClassName = "",
  scrollable = true,
  onRefresh,
  refreshing = false,
  onLoadMore,
  hasMore = true,
  loadingMore: loadingMoreProp,
  lowerThreshold = 100,
}: PageLayoutProps) {
  const handleScrollToLower = useCallback(() => {
    if (!onLoadMore || !hasMore || loadingMoreProp) return;
    onLoadMore();
  }, [onLoadMore, hasMore, loadingMoreProp]);

  useDidShow(() => {
    // 页面显示时钩子预留
  });

  const enableRefresh = Boolean(onRefresh);

  // Loading 态
  if (loading) {
    return (
      <View className={`min-h-screen bg-bg flex flex-col page-layout page-layout--loading ${className}`}>
        {header}
        <View className={`page-layout-content ${contentClassName}`}>
          <PullRefresh loading text={loadingText || "加载中…"} />
        </View>
      </View>
    );
  }

  // 下拉刷新 + 上拉加载
  if (enableRefresh || onLoadMore) {
    return (
      <View className={`min-h-screen bg-bg flex flex-col page-layout ${className}`}>
        {header}
        <ScrollView
          className={`flex-1 overflow-y-auto page-layout-scroll ${contentClassName}`}
          scrollY
          refresherEnabled={enableRefresh}
          refresherTriggered={refreshing}
          onRefresherRefresh={() => {
            if (onRefresh) {
              const r = onRefresh();
              if (r && typeof (r as Promise<any>).finally === "function") {
                (r as Promise<any>).finally(() => {
                  if (Taro.stopPullDownRefresh) Taro.stopPullDownRefresh();
                });
              }
            }
          }}
          onScrollToLower={onLoadMore ? handleScrollToLower : undefined}
          lowerThreshold={lowerThreshold}
        >
          {children}
          {onLoadMore && (
            <View className="page-loadmore">
              {loadingMoreProp ? (
                <View className="page-loadmore-inner">
                  <View className="page-loadmore-spinner" />
                  <Text className="page-loadmore-text">加载中…</Text>
                </View>
              ) : hasMore ? (
                <Text className="page-loadmore-text page-loadmore-text--hint">上拉加载更多</Text>
              ) : (
                <Text className="page-loadmore-text page-loadmore-text--end">— 已经到底了 —</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // 普通滚动容器
  if (scrollable) {
    return (
      <View className={`min-h-screen bg-bg flex flex-col page-layout ${className}`}>
        {header}
        <View className={`flex-1 overflow-y-auto page-layout-content ${contentClassName}`}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View className={`min-h-screen bg-bg flex flex-col page-layout ${className}`}>
      {header}
      <View className={`page-layout-content ${contentClassName}`}>{children}</View>
    </View>
  );
}
