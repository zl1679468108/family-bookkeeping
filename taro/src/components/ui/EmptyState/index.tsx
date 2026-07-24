/**
 * EmptyState — 插画 + 一段描述（无标题层级）
 *
 * - 默认全局插画（人物 + 空箱子 + 问号），随主题重着色
 * - 文案优先 description；未传时回退 title（兼容旧调用）
 * - 可选 action
 */
import { ReactNode, useMemo } from "react";
import { View, Text, Image } from "@tarojs/components";
import { getEmptyIconDataUrl } from "../../../utils/emptyIcons";
import {
  resolveEmptyStateText,
  resolveEmptyIconSize,
  buildEmptyStateClassName,
  type EmptyStateVariant,
} from "../../../utils/emptyState";
import { useTheme } from "../../../context/ThemeContext";
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
  variant?: EmptyStateVariant;
  /** 插画尺寸（rpx） */
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
  const { isDark } = useTheme();
  const resolvedIconSize = resolveEmptyIconSize(variant, "taro", iconSize);
  const illustrationSrc = useMemo(() => getEmptyIconDataUrl(isDark), [isDark]);
  const text = resolveEmptyStateText(description, title);

  const renderIcon =
    icon ?? (
      <Image
        className="ui-empty__icon-img"
        src={illustrationSrc}
        mode="aspectFit"
        style={{
          width: `${resolvedIconSize}rpx`,
          height: `${resolvedIconSize}rpx`,
          display: "block",
        }}
      />
    );

  return (
    <View className={buildEmptyStateClassName(variant, className, "ui-empty")}>
      {renderIcon ? <View className="ui-empty__icon">{renderIcon}</View> : null}
      {text ? <Text className="ui-empty__desc">{text}</Text> : null}
      {action ? <View className="ui-empty__action">{action}</View> : null}
    </View>
  );
}

export default EmptyState;
