/**
 * Icon — 使用本地 SVG 文件，严格对齐设计稿 v4
 *
 * SVG 文件通过 config/index.ts 的 copy.patterns 复制到 dist/assets/icons/
 * Image 组件 src 使用绝对路径 /assets/icons/xxx.svg
 *
 * 颜色方案：
 * - 绿色图标（选中状态）：xxx.svg（stroke="#5B9A7A"）
 * - 灰色图标（未选中状态）：xxx-gray.svg（stroke="#B0ADA6"）
 * - 传了 color prop：动态创建 SVG（用 View + mask 方案）
 */
import { View, Image } from "@tarojs/components";

export type IconName =
  // TabBar 图标（绿色 + 灰色两套）
  | "home"
  | "home-gray"
  | "transactions"
  | "transactions-gray"
  | "statistics"
  | "statistics-gray"
  | "profile"
  | "profile-gray"
  // 其他图标
  | "add"
  | "user"
  | "back"
  | "search"
  | "edit"
  | "delete"
  | "book"
  | "budget"
  | "category"
  | "location"
  | "calendar"
  | "note"
  | "email"
  | "lock"
  | "close"
  | "template"
  | "settings"
  | "chevron-down"
  | "chevron-right";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

/** 图标名称 → SVG 文件名（不含扩展名） */
function getIconFile(name: IconName): string {
  const map: Record<IconName, string> = {
    // TabBar
    home: "home",
    "home-gray": "home-gray",
    transactions: "transactions",
    "transactions-gray": "transactions-gray",
    statistics: "statistics",
    "statistics-gray": "statistics-gray",
    profile: "profile",
    "profile-gray": "profile-gray",
    // 其他
    add: "add",
    user: "profile",
    back: "back",
    search: "search",
    edit: "edit",
    delete: "delete",
    book: "book",
    budget: "budget",
    category: "category",
    location: "location",
    calendar: "calendar",
    note: "note",
    email: "email",
    lock: "lock",
    close: "close",
    template: "template",
    settings: "settings",
    "chevron-down": "chevron-down",
    "chevron-right": "chevron-down",
  };
  return map[name] || "home";
}

/** 构建 SVG 文件的绝对路径 */
function getSvgPath(name: IconName): string {
  const file = getIconFile(name);
  return `/assets/icons/${file}.svg`;
}

/**
 * 用 Image 组件渲染 SVG（颜色固定，不支持动态改色）
 * 微信小程序 image 组件支持本地 SVG 文件（基础库 2.9.0+）
 *
 * 如果传了 color prop，则使用 View + mask 方案（支持动态颜色）
 */
function IconWithImage({ name, size = 44, color, className }: IconProps) {
  const s = size!;
  const svgPath = getSvgPath(name);
  const rotate =
    name === "chevron-right" ? "rotate(-90deg)" : undefined;

  // 如果传了具体的颜色值（不是 "gray"），则用 View + mask 方案
  if (color && color !== "gray") {
    return (
      <View
        className={className}
        style={{
          width: `${s}rpx`,
          height: `${s}rpx`,
          display: "inline-block",
          flexShrink: 0,
          WebkitMaskImage: `url("/assets/icons/${getIconFile(name).replace("-gray", "")}.svg")`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          backgroundColor: color,
          transform: rotate ? (rotate as any) : undefined,
        } as any}
      />
    );
  }

  // 否则用 Image 方案（颜色固定）
  return (
    <View
      className={className}
      style={{
        width: `${s}rpx`,
        height: `${s}rpx`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: rotate ? (rotate as any) : undefined,
      }}
    >
      <Image
        src={svgPath}
        mode="aspectFit"
        style={{
          width: `${s}rpx`,
          height: `${s}rpx`,
          display: "block",
        }}
      />
    </View>
  );
}

/** 主入口 */
export default function Icon(props: IconProps) {
  return <IconWithImage {...props} />;
}

export {};
