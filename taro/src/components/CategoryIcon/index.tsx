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
  /** 单位：px（不是 rpx）；若设置 fill=true 则忽略 size，撑满父容器 */
  size?: number;
  className?: string;
  background?: string;
  border?: string;
  borderRadius?: number;
  color?: string;
  /** 撑满父容器（width/height: 100%），优先级高于 size */
  fill?: boolean;
}

export default function CategoryIcon({
  icon,
  size = 24,
  className = "",
  background = "transparent",
  border = "none",
  borderRadius = 8,
  color = "#1a1c19",
  fill = false,
}: CategoryIconProps) {
  if (!icon) return null;

  const boxSize = fill ? "100%" : `${size}px`;
  const innerSize = fill ? "100%" : `${Math.max(size - 4, 12)}px`;

  // 1. URL（自定义上传图标）
  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return (
      <View
        className={className}
        style={{
          width: boxSize,
          height: boxSize,
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
            width: innerSize,
            height: innerSize,
            display: "block",
          }}
        />
      </View>
    );
  }

  // 2. platform_xxx（购物平台图标）
  if (isPlatformIcon(icon)) {
    const key = icon.replace("platform_", "");
    const innerPx = fill ? "100%" : Math.round(size * 0.75);
    return (
      <View
        className={className}
        style={{
          width: boxSize,
          height: boxSize,
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
          src={renderPlatformIconSvg(key, fill ? 0 : (innerPx as number), color)}
          mode="aspectFit"
          style={{
            width: innerPx,
            height: innerPx,
            display: "block",
          }}
        />
      </View>
    );
  }

  // 3. 账本图标 key（default/home/work ...）
  if (isBookIconKey(icon)) {
    const innerPx = fill ? "100%" : Math.round(size * 0.75);
    return (
      <View
        className={className}
        style={{
          width: boxSize,
          height: boxSize,
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
          src={renderBookIconSvg(icon, fill ? 0 : (innerPx as number), color)}
          mode="aspectFit"
          style={{
            width: innerPx,
            height: innerPx,
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
        width: boxSize,
        height: boxSize,
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
          fontSize: fill ? "inherit" : `${Math.round(size * 0.55)}px`,
          lineHeight: 1,
          color,
        }}
      >
        {icon}
      </Text>
    </View>
  );
}
