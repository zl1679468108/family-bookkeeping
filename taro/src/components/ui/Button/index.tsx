/**
 * Button — 通用按钮（对齐 PC frontend/src/components/ui/Button）
 * variant: default/primary/secondary/outline/ghost/danger
 * size: sm(56rpx)/md(72rpx)/lg(88rpx)
 * 适配：div/button → 可点击 View；hover → active；新增 loading 内置态
 */
import { ReactNode } from "react";
import {
  buildUiButtonClassName,
  type ButtonVariant,
  type ButtonSize,
} from "../../../utils/button";
import { View, Text } from "@tarojs/components";
import "./index.scss";

export type { ButtonVariant, ButtonSize };

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
  const cls = buildUiButtonClassName({
    variant,
    size,
    block,
    loading,
    disabled,
    className,
  });

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
