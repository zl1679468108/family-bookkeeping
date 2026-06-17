/**
 * renderCategoryIcon — 通用分类图标渲染工具
 * 参考 PC 端 frontend/src/utils/renderCategoryIcon.tsx 的实现思路：
 * - URL (http/https) → <Image>，渲染用户上传的自定义图标
 * - 其他 → <Text>（emoji / 纯文本）
 *
 * 用于需要在已有容器（如 .txn-icon / .ci-emoji）内放置图标内容的场景，
 * 避免直接 <Text>{icon}</Text> 把 URL 当文本渲染。
 */
import { Image, Text } from "@tarojs/components";
import { useState } from "react";

interface RenderCategoryIconOptions {
  /** 图标尺寸（rpx），同时作用于 Image 和 emoji 字号 */
  size?: number;
  /** 自定义 className，会附加到 Image/Text */
  className?: string;
  /** emoji 模式下的 fontSize 倍率，默认 1 */
  fontScale?: number;
  /** 图片加载失败时的 fallback emoji */
  fallbackIcon?: string;
}

export const renderCategoryIcon = (
  icon: string | undefined,
  options: RenderCategoryIconOptions = {},
) => {
  if (!icon) return null;

  const { size = 32, className = "", fontScale = 1, fallbackIcon = "📌" } = options;

  // 1. URL → Image（带错误降级）
  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return (
      <ImageWithFallback
        src={icon}
        fallback={fallbackIcon}
        size={size}
        className={className}
        fontScale={fontScale}
      />
    );
  }

  // 2. 默认：emoji / 纯文本
  return (
    <Text
      className={className}
      style={{ fontSize: `${Math.round(size * fontScale)}rpx`, lineHeight: 1 }}
    >
      {icon}
    </Text>
  );
};

/** 内部组件：图片加载失败时自动降级为 emoji */
function ImageWithFallback({
  src,
  fallback,
  size,
  className,
  fontScale,
}: {
  src: string;
  fallback: string;
  size: number;
  className: string;
  fontScale: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Text
        className={className}
        style={{ fontSize: `${Math.round(size * fontScale)}rpx`, lineHeight: 1 }}
      >
        {fallback}
      </Text>
    );
  }

  return (
    <Image
      src={src}
      mode="aspectFit"
      className={className}
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        display: "block",
      }}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * 判断 icon 是否为 URL（用于在 Picker / 仅支持文本的下拉里做降级）
 */
export const isIconUrl = (icon: string | undefined): boolean =>
  !!icon && (icon.startsWith("http://") || icon.startsWith("https://"));
