/**
 * Button — 通用按钮（对齐 PC frontend/src/components/ui/Button）
 * variant: default/primary/secondary/outline/ghost/danger
 * size: sm(56rpx)/md(72rpx)/lg(88rpx)
 * 适配：div/button → 可点击 View；hover → active；新增 loading 内置态
 */
import { ReactNode } from "react";
import { cx } from "../../../utils/cx";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Button({
  variant = "default",
  size = "md",
  icon,
  block = false,
  loading = false,
  disabled = false,
  children,
  className = "",
  onClick,
}: ButtonProps) {
  const cls = cx(
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    block && "ui-btn--block",
    loading && "ui-btn--loading",
    disabled && "ui-btn--disabled",
    className,
  );

  return (
    <View
      className={cls}
      hoverClass={disabled || loading ? "" : "ui-btn--pressed"}
      hoverStayTime={100}
      onClick={(e) => {
        if (disabled || loading) return;
        e.stopPropagation();
        onClick?.();
      }}
    >
      {loading ? (
        <View className="ui-btn__spinner" />
      ) : icon ? (
        <View className="ui-btn__icon">{icon}</View>
      ) : null}
      {children ? <Text className="ui-btn__label">{children}</Text> : null}
    </View>
  );
}

export default Button;
