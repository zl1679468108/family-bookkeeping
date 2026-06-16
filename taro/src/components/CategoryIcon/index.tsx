/**
 * CategoryIcon — 通用分类图标渲染组件
 * - URL (http/https) → <Image>
 * - 其他 → <Text>（emoji / 纯文本）
 */
import { View, Text, Image } from "@tarojs/components";

interface CategoryIconProps {
  icon?: string;
  size?: number;
  className?: string;
  background?: string;
  border?: string;
  borderRadius?: number;
}

export default function CategoryIcon({
  icon,
  size = 64,
  className = "",
  background = "#f6f7f4",
  border = "1rpx solid #e9ecef",
  borderRadius = 16,
}: CategoryIconProps) {
  if (!icon) return null;

  const isUrl = icon.startsWith("http://") || icon.startsWith("https://");

  return (
    <View
      className={className}
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        borderRadius: `${borderRadius}rpx`,
        background,
        border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {isUrl ? (
        <Image
          src={icon}
          mode="aspectFit"
          style={{
            width: `${size - 8}rpx`,
            height: `${size - 8}rpx`,
            display: "block",
          }}
        />
      ) : (
        <Text style={{ fontSize: `${Math.round(size * 0.55)}rpx`, lineHeight: 1 }}>{icon}</Text>
      )}
    </View>
  );
}
