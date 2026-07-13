/**
 * EmptyState — 空状态占位（全局公共组件）
 *
 * 设计约定：
 * - 图标：全模块共用同一个「空盒子」线性图标（getEmptyIconDataUrl），
 *   不传 icon 时自动渲染；个别模块可用 icon 覆盖。
 * - 标题：title 由各模块自定（核心可定制项）。
 * - 可选 description / action（如「去记一笔」按钮）。
 * - variant: default（居中带 action）/ compact（小尺寸）/ full（整屏）。
 */
import { ReactNode } from "react";
import { View, Text, Image } from "@tarojs/components";
import { getEmptyIconDataUrl } from "../../../utils/emptyIcons";
import "./index.scss";

export interface EmptyStateProps {
  /** 自定义图标；不传则使用全局统一的空状态图标 */
  icon?: ReactNode;
  /** 标题（各模块自定，核心可定制项） */
  title?: ReactNode;
  /** 补充说明 */
  description?: ReactNode;
  /** 操作区（如按钮） */
  action?: ReactNode;
  variant?: "default" | "compact" | "full";
  /** 默认图标尺寸（px → rpx），不传按 variant 给默认值 */
  iconSize?: number;
  className?: string;
}

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
    iconSize ?? (variant === "compact" ? 64 : variant === "full" ? 120 : 96);

  const renderIcon =
    icon ?? (
      <Image
        className="ui-empty__icon-img"
        src={getEmptyIconDataUrl()}
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
