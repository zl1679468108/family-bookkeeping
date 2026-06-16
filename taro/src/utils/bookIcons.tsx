/**
 * 账本图标（SVG）—— 与 PC 端一致的数据定义
 * 使用 <BookIcon iconKey={iconKey} size={size} color={color} /> 渲染
 */
import React from "react";

export interface BookIconSvgSpec {
  width: number;
  height: number;
  viewBox: string;
  children: Array<{
    tag: "path" | "line" | "polyline" | "circle" | "rect" | "polygon";
    attrs: Record<string, string | number>;
  }>;
}

export const BOOK_ICONS: { key: string; label: string }[] = [
  { key: "default", label: "账本" },
  { key: "money", label: "财富" },
  { key: "home", label: "家庭" },
  { key: "family", label: "家人" },
  { key: "car", label: "交通" },
  { key: "travel", label: "旅行" },
  { key: "food", label: "美食" },
  { key: "shopping", label: "购物" },
  { key: "health", label: "健康" },
  { key: "movie", label: "电影" },
  { key: "game", label: "游戏" },
  { key: "phone", label: "数码" },
  { key: "computer", label: "电脑" },
  { key: "camera", label: "摄影" },
  { key: "music", label: "音乐" },
  { key: "soccer", label: "足球" },
  { key: "basketball", label: "篮球" },
  { key: "target", label: "目标" },
  { key: "art", label: "艺术" },
  { key: "note", label: "笔记" },
];

// 为减少体积与简化逻辑，以下仅输出纯文本 key → emoji 映射
// （Taro 在小程序端 SVG 渲染会更复杂，直接用 emoji 更稳定）
export const BOOK_ICON_EMOJI_MAP: Record<string, string> = {
  default: "📒",
  money: "💰",
  home: "🏠",
  family: "👨‍👩‍👧",
  car: "🚗",
  travel: "✈️",
  food: "🍔",
  shopping: "🛒",
  health: "💊",
  movie: "🎬",
  game: "🎮",
  phone: "📱",
  computer: "💻",
  camera: "📷",
  music: "🎵",
  soccer: "⚽",
  basketball: "🏀",
  target: "🎯",
  art: "🎨",
  note: "📝",
};

export const getBookEmojiByKey = (iconKey?: string): string => {
  if (!iconKey) return BOOK_ICON_EMOJI_MAP.default;
  return BOOK_ICON_EMOJI_MAP[iconKey] || BOOK_ICON_EMOJI_MAP.default;
};

/**
 * 兼容旧数据：当 icon 是 emoji/纯文本时直接用，否则查字典
 */
export const getBookIconText = (iconKey?: string): string => {
  if (!iconKey) return BOOK_ICON_EMOJI_MAP.default;
  // 本身就是 emoji（如 '📒' '🛒'）或短文本（≤3 chars），直接返回
  if (iconKey.length <= 3) return iconKey;
  // 否则当作 key 查字典
  return BOOK_ICON_EMOJI_MAP[iconKey] || BOOK_ICON_EMOJI_MAP.default;
};

/**
 * 纯 React SVG 图标（用于 PC 项目风格的图标展示）
 * 在 H5 端可用；小程序端如需 SVG，请确认 baseLib 支持（此处提供 emoji 兜底）。
 */
interface BookIconProps {
  iconKey?: string;
  size?: number; // rpx
  color?: string;
}

export const BookIcon: React.FC<BookIconProps> = ({ iconKey, size = 36, color = "#2d9d8a" }) => {
  const emoji = getBookIconText(iconKey);
  // 小程序端渲染 SVG 复杂，这里直接用文本 emoji + 统一容器样式
  return (
    <Text
      style={{
        fontSize: size * 0.75 + "rpx",
        color,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {emoji}
    </Text>
  );
};

export default BookIcon;
