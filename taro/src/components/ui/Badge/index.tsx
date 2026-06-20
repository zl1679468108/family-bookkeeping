/**
 * Badge — 徽标/标签（小程序新增，PC 用 .badge class）
 * variant: default/primary/income/expense/warn/info
 */
import { ReactNode } from "react";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type BadgeVariant = "default" | "primary" | "income" | "expense" | "warn" | "info";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  children?: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", size = "sm", children, className = "" }: BadgeProps) {
  return (
    <View className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`}>
      <Text className="ui-badge__text">{children}</Text>
    </View>
  );
}

export default Badge;
