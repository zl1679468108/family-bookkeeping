/**
 * CategoryIcon —— 通用分类/账本图标渲染组件
 *
 * 与 PC 端 icon-grid 保持一致的图标体系：
 * 1. URL（http/https） → 使用 <Image> 渲染（自定义上传图标）
 * 2. platform_xxx 前缀 → 调用 PLATFORM_SVG_MAP 中的线条 SVG 渲染
 * 3. BOOK_ICON_SVG_MAP 中的 key → 调用账本图标 SVG 渲染
 * 4. 其他（emoji/纯文本）→ 原样渲染为文本
 */
import { View, Image, Text } from "@tarojs/components";
import { renderBookIconSvg, isBookIconKey } from "../../utils/bookIcons";
import {
  renderPlatformIconSvg,
  isPlatformIcon,
} from "../../utils/platformIcons";

interface CategoryIconProps {
  icon?: string;
  size?: number; // 单位：px（不是 rpx）
  className?: string;
  background?: string;
  border?: string;
  borderRadius?: number;
  color?: string;
}

export default function CategoryIcon({
  icon,
  size = 24,
  className = "",
  background = "#f6f7f4",
  border = "1rpx solid #e9ecef",
  borderRadius = 8,
  color = "#1a1c19",
}: CategoryIconProps) {
  if (!icon) return null;

  // 1. URL（自定义上传图标）
  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return (
      <View
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${borderRadius}px`,
          background,
          border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <Image
          src={icon}
          mode="aspectFit"
          style={{
            width: `${Math.max(size - 4, 12)}px`,
            height: `${Math.max(size - 4, 12)}px`,
            display: "block",
          }}
        />
      </View>
    );
  }

  // 2. platform_xxx（购物平台图标）
  if (isPlatformIcon(icon)) {
    const key = icon.replace("platform_", "");
    return (
      <View
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${borderRadius}px`,
          background,
          border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <Image
          src={renderPlatformIconSvg(key, Math.round(size * 0.75), color)}
          mode="aspectFit"
          style={{
            width: `${Math.round(size * 0.75)}px`,
            height: `${Math.round(size * 0.75)}px`,
            display: "block",
          }}
        />
      </View>
    );
  }

  // 3. 账本图标 key（default/home/work ...）
  if (isBookIconKey(icon)) {
    return (
      <View
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${borderRadius}px`,
          background,
          border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <Image
          src={renderBookIconSvg(icon, Math.round(size * 0.75), color)}
          mode="aspectFit"
          style={{
            width: `${Math.round(size * 0.75)}px`,
            height: `${Math.round(size * 0.75)}px`,
            display: "block",
          }}
        />
      </View>
    );
  }

  // 4. emoji / 纯文本（分类预设）
  return (
    <View
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background,
        border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Text
        style={{
          fontSize: `${Math.round(size * 0.55)}px`,
          lineHeight: 1,
          color,
        }}
      >
        {icon}
      </Text>
    </View>
  );
}
