/**
 * renderCategoryIcon — 通用分类/账本图标渲染工具
 * 对齐 PC 端 frontend/src/utils/renderCategoryIcon.tsx：
 * - URL (http/https) → <Image>，渲染用户上传的自定义图标
 * - "platform_xxx" → <Image src={平台 SVG data URL}>
 * - BOOK_ICON_SVG_MAP key → <Image src={账本图标 SVG data URL}>
 * - 其他 → <Text>（emoji / 纯文本）
 *
 * 用于需要在已有容器内放置图标内容的场景，
 * 避免直接 <Text>{icon}</Text> 把 URL / SVG key 当文本渲染。
 */
import { Image, Text } from "@tarojs/components";
import { renderBookIconSvg, isBookIconKey } from "./bookIcons";
import {
  renderPlatformIconSvg,
  isPlatformIcon,
} from "./platformIcons";

interface RenderCategoryIconOptions {
  /** 图标尺寸（px），同时作用于 Image 尺寸和 emoji 字号 */
  size?: number;
  /** 自定义 className，会附加到 Image/Text */
  className?: string;
  /** emoji 模式下的 fontSize 倍率，默认 1 */
  fontScale?: number;
}

export const renderCategoryIcon = (
  icon: string | undefined,
  options: RenderCategoryIconOptions = {},
) => {
  if (!icon) return null;

  const { size = 24, className = "", fontScale = 1 } = options;

  // 1. URL → <Image>
  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return (
      <Image
        src={icon}
        mode="aspectFit"
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: "block",
        }}
      />
    );
  }

  // 2. platform_xxx → 购物平台 SVG
  if (isPlatformIcon(icon)) {
    const key = icon.replace("platform_", "");
    return (
      <Image
        src={renderPlatformIconSvg(key, Math.round(size * 0.75))}
        mode="aspectFit"
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: "block",
        }}
      />
    );
  }

  // 3. 账本图标 key（default/home/work ...）
  if (isBookIconKey(icon)) {
    return (
      <Image
        src={renderBookIconSvg(icon, Math.round(size * 0.75))}
        mode="aspectFit"
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: "block",
        }}
      />
    );
  }

  // 4. 默认：emoji / 纯文本
  return (
    <Text
      className={className}
      style={{ fontSize: `${Math.round(size * fontScale)}px`, lineHeight: 1 }}
    >
      {icon}
    </Text>
  );
};

/**
 * 判断 icon 是否为 URL（用于在 Picker / 仅支持文本的下拉里做降级）
 */
export const isIconUrl = (icon: string | undefined): boolean =>
  !!icon && (icon.startsWith("http://") || icon.startsWith("https://"));
