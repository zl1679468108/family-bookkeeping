/**
 * EmptyState — 插画 + 一段描述（无标题层级）
 *
 * - 默认全局插画（人物 + 空箱子 + 问号）
 * - 文案优先 description；未传时回退 title（兼容旧调用）
 * - 可选 action
 */
import { ReactNode } from "react";
import { View, Text, Image } from "@tarojs/components";
import { getEmptyIconDataUrl } from "../../../utils/emptyIcons";
import "./index.scss";

export interface EmptyStateProps {
  /** 自定义图标；不传则使用全局统一插画 */
  icon?: ReactNode;
  /**
   * @deprecated 请用 description。保留仅为兼容旧调用，会按描述样式渲染。
   */
  title?: ReactNode;
  /** 描述文案（主文案） */
  description?: ReactNode;
  /** 操作区（如按钮） */
  action?: ReactNode;
  variant?: "default" | "compact" | "full";
  /** 插画尺寸（rpx） */
  iconSize?: number;
  className?: string;
}

const EMPTY_ILLUSTRATION_SRC = getEmptyIconDataUrl();

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  iconSize,
  className = "",
}: EmptyStateProps) {
  const resolvedIconSize =
    iconSize ?? (variant === "compact" ? 200 : variant === "full" ? 360 : 300);

  const renderIcon =
    icon ?? (
      <Image
        className="ui-empty__icon-img"
        src={EMPTY_ILLUSTRATION_SRC}
        mode="aspectFit"
        style={{
          width: `${resolvedIconSize}rpx`,
          height: `${resolvedIconSize}rpx`,
          display: "block",
        }}
      />
    );

  // 单段文案：优先 description；两者皆有且为字符串时合并，避免旧调用丢标题
  const text =
    description != null && title != null && description !== title
      ? typeof description === 'string' && typeof title === 'string'
        ? `${title}。${description}`
        : description
      : description ?? title;

  return (
    <View className={`ui-empty ui-empty--${variant} ${className}`}>
      {renderIcon ? <View className="ui-empty__icon">{renderIcon}</View> : null}
      {text ? <Text className="ui-empty__desc">{text}</Text> : null}
      {action ? <View className="ui-empty__action">{action}</View> : null}
    </View>
  );
}

export default EmptyState;
