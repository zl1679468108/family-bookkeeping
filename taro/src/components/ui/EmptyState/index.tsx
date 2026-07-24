/**
 * EmptyState — 空状态占位（全局公共组件）
 *
 * 设计约定：
 * - 图标：全模块共用同一插画（getEmptyIconDataUrl：人物 + 空箱子 + 问号）
 * - 主文案：title 由各模块自定
 * - 可选 description / action
 * - variant: default / compact / full
 */
import { ReactNode } from "react";
import { View, Text, Image } from "@tarojs/components";
import { getEmptyIconDataUrl } from "../../../utils/emptyIcons";
import "./index.scss";

export interface EmptyStateProps {
  /** 自定义图标；不传则使用全局统一插画 */
  icon?: ReactNode;
  /** 主文案（各模块自定） */
  title?: ReactNode;
  /** 补充说明 */
  description?: ReactNode;
  /** 操作区（如按钮） */
  action?: ReactNode;
  variant?: "default" | "compact" | "full";
  /** 默认插画尺寸（rpx），不传按 variant 给默认值 */
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
  // 插画 rpx：compact 200 / default 300 / full 360（对应约 100/150/180 px）
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

  return (
    <View className={`ui-empty ui-empty--${variant} ${className}`}>
      {renderIcon ? <View className="ui-empty__icon">{renderIcon}</View> : null}
      {title ? <Text className="ui-empty__title">{title}</Text> : null}
      {description ? <Text className="ui-empty__desc">{description}</Text> : null}
      {action ? <View className="ui-empty__action">{action}</View> : null}
    </View>
  );
}

export default EmptyState;
