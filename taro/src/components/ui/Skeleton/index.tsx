/**
 * Skeleton — 骨架屏（对齐 PC Skeleton + 预设）
 */
import { ReactNode } from "react";
import { View } from "@tarojs/components";
import "./index.scss";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  marginBottom?: string | number;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "32rpx",
  borderRadius = "var(--rs)",
  marginBottom = 0,
  className = "",
}: SkeletonProps) {
  return (
    <View
      className={`ui-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        marginBottom: marginBottom || undefined,
      }}
    />
  );
}

/* 预设组合 */
export function AvatarSkeleton({ size = 80 }: { size?: number }) {
  return <Skeleton width={`${size}rpx`} height={`${size}rpx`} borderRadius="50%" />;
}
export function ButtonSkeleton({ width = "200rpx" }: { width?: string }) {
  return <Skeleton width={width} height="72rpx" />;
}
export function InputSkeleton() {
  return <Skeleton height="80rpx" marginBottom="24rpx" />;
}
export function TextLineSkeleton({ width = "100%" }: { width?: string }) {
  return <Skeleton width={width} height="28rpx" marginBottom="16rpx" />;
}
export function TextParagraphSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <TextLineSkeleton key={i} width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </View>
  );
}
export function CardGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View className="ui-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="ui-skeleton-grid__item">
          <Skeleton height="120rpx" marginBottom="16rpx" />
          <TextLineSkeleton width="50%" />
        </View>
      ))}
    </View>
  );
}
export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="ui-skeleton-stats">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="ui-skeleton-stats__item">
          <Skeleton width="80rpx" height="24rpx" marginBottom="12rpx" />
          <Skeleton width="120rpx" height="40rpx" />
        </View>
      ))}
    </View>
  );
}
export function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="ui-skeleton-row">
          <Skeleton width="80rpx" height="80rpx" borderRadius="50%" />
          <View className="ui-skeleton-row__text">
            <Skeleton width="40%" height="28rpx" marginBottom="12rpx" />
            <Skeleton width="70%" height="24rpx" />
          </View>
        </View>
      ))}
    </View>
  );
}

export default Skeleton;
