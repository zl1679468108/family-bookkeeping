/**
 * AppSection — 通用内容分组容器。
 * 负责标题、右侧操作、容器边框和内容留白，页面只放业务内容。
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import { Skeleton } from "../Skeleton";
import "./index.scss";

interface AppSectionProps {
  title?: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
  flush?: boolean;
  loading?: boolean;
}

export default function AppSection({
  title,
  subtitle,
  actionText,
  onAction,
  children,
  className = "",
  bodyClassName = "",
  compact = false,
  flush = false,
  loading = false,
}: AppSectionProps) {
  return (
    <View
      className={`app-section ${compact ? "app-section--compact" : ""} ${flush ? "app-section--flush" : ""} ${className}`}
    >
      {(title || actionText) && (
        <View className="app-section__header">
          <View className="app-section__title-wrap">
            {title ? <Text className="app-section__title">{title}</Text> : null}
            {subtitle ? (
              <Text className="app-section__subtitle">{subtitle}</Text>
            ) : null}
          </View>
          {actionText ? (
            <Text className="app-section__action" onClick={onAction}>
              {actionText}
            </Text>
          ) : null}
        </View>
      )}
      <View className={`app-section__body ${bodyClassName}`}>
        {loading ? <Skeleton height="200rpx" /> : children}
      </View>
    </View>
  );
}
