/**
 * PageContainer — 全局页面容器（基于 PageLayout 的语义化封装）
 *
 * 收敛绝大多数页面的共性，子页面使用成本极低：
 *   - 统一间距（横向 32rpx / 顶部 18rpx+安全区 / 底部 32rpx+安全区），无需各自写 padding
 *   - 页面 loading 遮罩（loading）
 *   - 下拉刷新（onRefresh / refreshing）
 *   - 上拉加载更多（onLoadMore / hasMore / loadingMore）
 *   - 吸顶 header（filter 栏等）
 *   - 整页空状态（empty / emptyTitle / emptyDesc / emptyAction / emptyIcon）
 *   - 底部额外留白（bottomSpace，固定操作栏场景）
 *
 * 仅当「整页数据为空」时用 empty 相关 props；局部空态（如列表某区块）仍用 EmptyState 组件。
 *
 * Usage:
 *   <PageContainer loading={loading}>...内容...</PageContainer>
 *   <PageContainer
 *     loading={loading}
 *     empty={list.length === 0}
 *     emptyTitle="暂无交易记录"
 *     emptyDesc="调整筛选条件或新增一笔账单"
 *   >...列表...</PageContainer>
 */
import { ReactNode } from "react";
import PageLayout from "../PageLayout";
import EmptyState from "../ui/EmptyState";

interface PageContainerProps {
  children: ReactNode;
  /** 吸顶头部（渲染在滚动容器外部） */
  header?: ReactNode;
  /** 是否加载中，显示骨架屏/遮罩 */
  loading?: boolean;
  /** 加载中提示文字 */
  loadingText?: string;
  /** 见 PageLayout.loadingVariant */
  loadingVariant?: "overlay" | "list" | "cards" | "home";
  /** 外层容器 className */
  className?: string;
  /** 内容区 className（用于非 padding 的布局微调，如 flex/gap；间距由 PageContainer 统一提供） */
  contentClassName?: string;
  /** 是否可滚动（默认 true） */
  scrollable?: boolean;
  /** 下拉刷新回调；传入时开启下拉刷新 */
  onRefresh?: () => Promise<void> | void;
  /** 是否处于下拉刷新中（受控） */
  refreshing?: boolean;
  /** 是否在下拉刷新完成时显示 toast 提示（默认 true） */
  refreshToast?: boolean;
  /** 上拉加载更多回调；传入时开启上拉加载 */
  onLoadMore?: () => Promise<void> | void;
  /** 是否还有更多 */
  hasMore?: boolean;
  /** 正在加载更多（受控） */
  loadingMore?: boolean;
  /** 上拉加载阈值（rpx） */
  lowerThreshold?: number;
  /** 滚动回调（scrollTop） */
  onScroll?: (scrollTop: number) => void;
  /** 底部额外留白（rpx），用于底部固定操作栏 */
  bottomSpace?: number;
  /** 整页空状态：为 true 且非 loading 时渲染 EmptyState 替代 children */
  empty?: boolean;
  /** 空状态标题 */
  emptyTitle?: ReactNode;
  /** 空状态补充说明 */
  emptyDesc?: ReactNode;
  /** 空状态操作区（按钮等） */
  emptyAction?: ReactNode;
  /** 空状态自定义图标 */
  emptyIcon?: ReactNode;
  /** 空状态尺寸变体 */
  emptyVariant?: "default" | "compact" | "full";
}

export default function PageContainer({
  children,
  header,
  loading = false,
  loadingText,
  loadingVariant = "overlay",
  className = "",
  contentClassName,
  scrollable = true,
  onRefresh,
  refreshing = false,
  refreshToast = true,
  onLoadMore,
  hasMore = true,
  loadingMore = false,
  lowerThreshold = 100,
  onScroll,
  bottomSpace,
  empty = false,
  emptyTitle,
  emptyDesc,
  emptyAction,
  emptyIcon,
  emptyVariant = "default",
}: PageContainerProps) {
  const showEmpty = Boolean(empty) && !loading;

  return (
    <PageLayout
      header={header}
      loading={loading}
      loadingText={loadingText}
      loadingVariant={loadingVariant}
      className={className}
      contentClassName={contentClassName}
      scrollable={scrollable}
      onRefresh={onRefresh}
      refreshing={refreshing}
      refreshToast={refreshToast}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      loadingMore={loadingMore}
      lowerThreshold={lowerThreshold}
      onScroll={onScroll}
      bottomSpace={bottomSpace}
    >
      {showEmpty ? (
        <EmptyState
          description={
            emptyTitle && emptyDesc && emptyTitle !== emptyDesc
              ? `${emptyTitle}。${emptyDesc}`
              : (emptyDesc ?? emptyTitle)
          }
          action={emptyAction}
          icon={emptyIcon}
          variant={emptyVariant}
        />
      ) : (
        children
      )}
    </PageLayout>
  );
}
