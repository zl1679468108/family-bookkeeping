/**
 * Skeleton — loading placeholder component.
 * Supports list, card, and chart layout types.
 */
import { View } from "@tarojs/components";

export interface SkeletonProps {
  type?: "list" | "card" | "chart";
  count?: number;
}

function ListSkeleton() {
  return (
    <View className="skeleton-list-item flex items-center py-3 px-4 bg-card border-b">
      <View
        className="skeleton skeleton-circle"
        style={{ width: "68rpx", height: "68rpx", flexShrink: 0 }}
      />
      <View className="flex flex-col ml-2 flex-1" style={{ gap: "12rpx" }}>
        <View className="skeleton skeleton-text" style={{ width: "55%" }} />
        <View className="skeleton skeleton-text" style={{ width: "82%" }} />
      </View>
    </View>
  );
}

function CardSkeleton() {
  return (
    <View className="skeleton-card card p-3 mb-3">
      <View
        className="skeleton rounded-md"
        style={{ height: "160rpx", marginBottom: "24rpx" }}
      />
      <View
        className="skeleton skeleton-text"
        style={{ width: "65%", marginBottom: "12rpx" }}
      />
      <View className="skeleton skeleton-text" style={{ width: "40%" }} />
    </View>
  );
}

function ChartSkeleton() {
  return (
    <View className="skeleton-chart card p-3">
      <View
        className="skeleton rounded-md"
        style={{ width: "100%", height: "360rpx" }}
      />
    </View>
  );
}

export default function Skeleton({ type = "list", count = 3 }: SkeletonProps) {
  if (type === "chart") {
    return (
      <View className="skeleton-wrapper">
        <ChartSkeleton />
      </View>
    );
  }

  if (type === "card") {
    return (
      <View className="skeleton-wrapper px-3 py-3">
        {Array.from({ length: count }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </View>
    );
  }

  return (
    <View className="skeleton-wrapper">
      {Array.from({ length: count }, (_, i) => (
        <ListSkeleton key={i} />
      ))}
    </View>
  );
}
