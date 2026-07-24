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
import { ReactNode, useCallback, useEffect, useState, CSSProperties } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import {  useDidShow  } from "@tarojs/taro";
import LoadingOverlay from "../ui/LoadingOverlay";
import { TableRowsSkeleton, CardGridSkeleton, StatCardsSkeleton } from "../ui/Skeleton";
import { useTheme } from "../../context/ThemeContext";
import { useNavBarTheme } from "../../hooks/useNavBarTheme";
import "./index.scss";
import { toastSuccess, toastInfo } from "../../utils/toast";
import { ACTION_LOADING, ACTION_PULL_LOAD_MORE, ACTION_LIST_END } from "../../utils/actionCopy";
import { SUCCESS_REFRESH } from "../../utils/successCopy";
import { ERROR_REFRESH } from "../../utils/errorCopy";

interface PageLayoutProps {
  children: ReactNode;
  /** 吸顶头部（渲染在滚动容器外部，会在下拉刷新外） */
  header?: ReactNode;
  /** 是否加载中，显示骨架屏 Fallback */
  loading?: boolean;
  /** 加载中提示文字 */
  loadingText?: string;
  /**
   * loading 展示形态：
   * - overlay：全屏遮罩（默认，兼容旧行为）
   * - list：列表行骨架
   * - cards：双列卡片骨架
   * - home：统计卡 + 列表骨架
   */
  loadingVariant?: "overlay" | "list" | "cards" | "home";
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
  /** 是否在下拉刷新完成时显示 toast 提示（默认 true） */
  refreshToast?: boolean;
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
  loadingVariant = "overlay",
  className = "",
  contentClassName = "",
  scrollable = true,
  onRefresh,
  refreshing = false,
  refreshToast = true,
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

  // 内部自管理 refresher 动画的「显示/收起」，不再依赖外部 refreshing 复位的精确性：
  // - 外部 refreshing 仅作为「手动触发刷新」的可选受控信号（如切换账本后自动刷新），同步到本地
  // - 用户下拉触发的刷新，由本组件在 onRefresh 完成后强制收起，100% 兜底，绝不会再卡成转圈/三点点
  const [localRefreshing, setLocalRefreshing] = useState(refreshing);
  useEffect(() => {
    setLocalRefreshing(refreshing);
  }, [refreshing]);

  // Loading 态（遮罩或骨架；保留吸顶 header）
  if (loading) {
    const skeletonBody =
      loadingVariant === "home" ? (
        <View className="page-layout-skeleton">
          <StatCardsSkeleton count={3} />
          <View style={{ height: "24rpx" }} />
          <TableRowsSkeleton rows={4} />
        </View>
      ) : loadingVariant === "cards" ? (
        <View className="page-layout-skeleton">
          <CardGridSkeleton count={4} />
        </View>
      ) : loadingVariant === "list" ? (
        <View className="page-layout-skeleton">
          <TableRowsSkeleton rows={6} />
        </View>
      ) : null;

    return (
      <View className={`min-h-screen bg-bg flex flex-col page-layout ${themeClass} ${className}`}>
        {header}
        <View
          className={`page-layout-content ${
            loadingVariant === "overlay" ? "page-layout-content--overlay" : ""
          } ${contentClassName}`}
          style={contentStyle}
        >
          {loadingVariant === "overlay" || !skeletonBody ? (
            <LoadingOverlay tip={loadingText || ACTION_LOADING} />
          ) : (
            skeletonBody
          )}
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
          className="flex-1 overflow-y-auto page-layout-scroll"
          scrollY
          showScrollbar={false}
          refresherEnabled={enableRefresh}
          refresherTriggered={localRefreshing}
          refresherBackground={isDark ? "#1A1C19" : "#F6F7F4"}
          refresherDefaultStyle={isDark ? "white" : "black"}
          onScroll={(e) => {
            if (onScroll) onScroll(e.detail.scrollTop);
          }}
          onRefresherRefresh={() => {
            if (!onRefresh) return;
            // 立即进入刷新态，让微信原生层渲染出刷新动画（refresher-triggered=true）
            setLocalRefreshing(true);
            // 兜底收起：极端情况下（接口挂死 / Promise 不结算 / 微信时序异常）
            // 8s 后强制收起，绝不永久卡成三点点
            let guard: ReturnType<typeof setTimeout> | undefined;
            const finish = (ok: boolean) => {
              if (guard) clearTimeout(guard);
              setLocalRefreshing(false);
              if (refreshToast) {
                if (ok) toastSuccess(SUCCESS_REFRESH, 1200); else toastInfo(ERROR_REFRESH, 1200);
              }
            };
            guard = setTimeout(() => finish(false), 8000);
            // ⚠️ 关键修复：先让刷新动画渲染至少一帧（~300ms）再发起请求。
            // 微信 ScrollView 的 refresher 若在 refresher-triggered 变 true 后极快收到 false，
            // 会因动画尚未真正渲染而丢弃该 false，导致三点点永久卡住不收起。
            // 延迟发起可彻底规避「快接口」下的不收起问题。
            setTimeout(() => {
              try {
                const r = onRefresh();
                if (r && typeof (r as Promise<void>).then === "function") {
                  // 双分支，规避微信 regenerator 下 .finally 偶发不执行导致转圈卡死
                  (r as Promise<void>).then(
                    () => finish(true),
                    () => finish(false),
                  );
                } else {
                  finish(true);
                }
              } catch (e) {
                finish(false);
              }
            }, 300);
          }}
          onScrollToLower={onLoadMore ? handleScrollToLower : undefined}
          lowerThreshold={lowerThreshold}
        >
          <View className={`page-layout-inner ${contentClassName}`} style={contentStyle}>
            {children}
            {onLoadMore && (
              <View className="page-loadmore">
                {loadingMoreProp ? (
                  <View className="page-loadmore-inner">
                    <View className="page-loadmore-spinner" />
                    <Text className="page-loadmore-text">{ACTION_LOADING}</Text>
                  </View>
                ) : hasMore ? (
                  <Text className="page-loadmore-text page-loadmore-text--hint">{ACTION_PULL_LOAD_MORE}</Text>
                ) : (
                  <Text className="page-loadmore-text page-loadmore-text--end">{ACTION_LIST_END}</Text>
                )}
              </View>
            )}
          </View>
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
