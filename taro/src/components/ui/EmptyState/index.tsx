/**
 * EmptyState — 空状态占位（对齐 PC EmptyState）
 * variant: default（居中带 action）/compact（小尺寸）/full（整屏）
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "compact" | "full";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  return (
    <View className={`ui-empty ui-empty--${variant} ${className}`}>
      {icon ? <View className="ui-empty__icon">{icon}</View> : null}
      {title ? <Text className="ui-empty__title">{title}</Text> : null}
      {description ? <Text className="ui-empty__desc">{description}</Text> : null}
      {action ? <View className="ui-empty__action">{action}</View> : null}
    </View>
  );
}

export default EmptyState;
