/**
 * Icon — 使用本地 SVG 文件，严格对齐设计稿 v4
 * 
 * 所有 SVG 文件通过 config/index.ts 的 copy.patterns 复制到 dist/assets/icons/
 * Image 组件 src 使用绝对路径 /assets/icons/xxx.svg
 * 
 * 颜色方案：
 * - SVG 文件内已嵌入固定颜色（stroke="#2D9D8A" 或对应颜色）
 */
import { View, Image } from "@tarojs/components";

export type IconName =
  // TabBar 图标（绿色 + 灰色两套
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
  | "books"
  | "budget"
  | "budgets"
  | "category"
  | "categories"
  | "location"
  | "calendar"
  | "note"
  | "email"
  | "lock"
  | "close"
  | "template"
  | "templates"
  | "settings"
  | "chevron-down"
  | "chevron-right"
  | "annual"
  | "map"
  | "logout";

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
    books: "books",
    budget: "budget",
    budgets: "budgets",
    category: "category",
    categories: "categories",
    location: "location",
    calendar: "calendar",
    note: "note",
    email: "email",
    lock: "lock",
    close: "close",
    template: "template",
    templates: "templates",
    settings: "settings",
    "chevron-down": "chevron-down",
    "chevron-right": "chevron-down",
    annual: "annual",
    map: "map",
    logout: "logout",
  };
  return map[name] || "home";
}

/** 主入口 — 使用 Image 组件渲染 SVG（颜色已在 SVG 文件内固定） */
export default function Icon({ name, size = 44, className }: IconProps) {
  const s = size;
  const svgPath = `/assets/icons/${getIconFile(name)}.svg`;
  const rotate = name === "chevron-right" ? "rotate(-90deg)" : undefined;

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

export {};
