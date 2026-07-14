/**
 * PageLayout — 统一页面容器（使用系统默认导航栏）
 *
 * 不再渲染自定义 NavHeader，由微信系统导航栏承担标题显示。
 * 负责：下拉刷新、上拉加载、骨架屏 loading、内容容器，支持 header（吸顶插槽）。
 *
 * 统一间距标准（对齐首页）：
 *   横向 32rpx，顶部 calc(18rpx + safe-area-inset-top)，底部 calc(32rpx + safe-area-inset-bottom)。
 * 子页面无需再各自定义 content padding。需要底部额外留白（固定操作栏）时用 bottomSpace。
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
import { ReactNode, useCallback, CSSProperties } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import LoadingOverlay from "../ui/LoadingOverlay";
import { useTheme } from "../../context/ThemeContext";
import { useNavBarTheme } from "../../hooks/useNavBarTheme";
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
  /** 内容区 className（逃生舱，一般无需设置——间距已由 PageLayout 统一） */
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
  /** 滚动回调（透传 ScrollView 的 scrollTop，用于吸顶阴影等） */
  onScroll?: (scrollTop: number) => void;
  /** 底部额外留白（rpx），用于页面底部有固定操作栏的场景 */
  bottomSpace?: number;
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
  onScroll,
  bottomSpace,
}: PageLayoutProps) {
  const { isDark } = useTheme();
  const themeClass = isDark ? "theme-dark" : "";

  // 同步微信原生导航栏（标题栏）配色到当前主题
  useNavBarTheme();

  const handleScrollToLower = useCallback(() => {
    if (!onLoadMore || !hasMore || loadingMoreProp) return;
    onLoadMore();
  }, [onLoadMore, hasMore, loadingMoreProp]);

  useDidShow(() => {
    // 页面显示时钩子预留
  });

  // 底部额外留白（固定操作栏场景）：inline style 覆盖默认 padding-bottom
  const contentStyle: CSSProperties | undefined = bottomSpace
    ? { paddingBottom: `calc(${bottomSpace}rpx + env(safe-area-inset-bottom, 0))` }
    : undefined;

  const enableRefresh = Boolean(onRefresh);

  // Loading 态（遮罩覆盖内容区，保留吸顶 header）
  if (loading) {
    return (
      <View className={`min-h-screen bg-bg flex flex-col page-layout ${themeClass} ${className}`}>
        {header}
        <View
          className={`page-layout-content page-layout-content--overlay ${contentClassName}`}
          style={contentStyle}
        >
          <LoadingOverlay tip={loadingText || "加载中…"} />
        </View>
      </View>
    );
  }

  // 下拉刷新 + 上拉加载
  if (enableRefresh || onLoadMore) {
    return (
      <View className={`min-h-screen bg-bg flex flex-col page-layout ${themeClass} ${className}`}>
        {header}
        <ScrollView
          className={`flex-1 overflow-y-auto page-layout-scroll ${contentClassName}`}
          style={contentStyle}
          scrollY
          showScrollbar={false}
          refresherEnabled={enableRefresh}
          refresherTriggered={refreshing}
          onScroll={(e) => {
            if (onScroll) onScroll(e.detail.scrollTop);
          }}
          onRefresherRefresh={() => {
            if (onRefresh) {
              const r = onRefresh();
              // ⚠️ 用 .then(成功, 失败) 双分支停转，规避微信 regenerator 下 .finally 偶发不执行导致刷新转圈卡死
              if (r && typeof (r as Promise<any>).then === "function") {
                const stopPD = () => {
                  if (Taro.stopPullDownRefresh) Taro.stopPullDownRefresh();
                };
                (r as Promise<any>).then(stopPD, stopPD);
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
      <View className={`min-h-screen bg-bg flex flex-col page-layout ${themeClass} ${className}`}>
        {header}
        <View
          className={`flex-1 overflow-y-auto page-layout-content ${contentClassName}`}
          style={contentStyle}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View className={`min-h-screen bg-bg flex flex-col page-layout ${themeClass} ${className}`}>
      {header}
      <View className={`page-layout-content ${contentClassName}`} style={contentStyle}>
        {children}
      </View>
    </View>
  );
}
