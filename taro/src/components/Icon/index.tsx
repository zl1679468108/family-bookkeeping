/**
 * Icon — 本地 SVG 图标
 *
 * 渲染策略：
 * 1. 传入 color → CSS mask + backgroundColor，支持主题色/暗色动态着色
 * 2. 未传 color → Image 渲染原 SVG（内嵌描边色）
 */
import { View, Image } from "@tarojs/components";
import "./index.scss";

export type IconName =
  | "home"
  | "home-gray"
  | "transactions"
  | "transactions-gray"
  | "statistics"
  | "statistics-gray"
  | "profile"
  | "profile-gray"
  | "add"
  | "user"
  | "back"
  | "search"
  | "edit"
  | "delete"
  | "delete-red"
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
  | "logout"
  | "monitor"
  | "info"
  | "switch-account"
  | "sun"
  | "moon"
  | "clock"
  | "workbench"
  | "workbench-gray";

interface IconProps {
  name: IconName;
  /** rpx */
  size?: number;
  /** 动态着色；不传则使用 SVG 内嵌色 */
  color?: string;
  className?: string;
}

/** 语义色快捷，避免业务层硬编码 hex */
export const ICON_COLOR = {
  primary: "var(--pr)",
  muted: "var(--fg3)",
  fg: "var(--fg)",
  danger: "var(--exp)",
  onPrimary: "var(--on-pr, #fff)",
} as const;

const FILE_MAP: Record<IconName, string> = {
  home: "home",
  "home-gray": "home-gray",
  transactions: "transactions",
  "transactions-gray": "transactions-gray",
  statistics: "statistics",
  "statistics-gray": "statistics-gray",
  profile: "profile",
  "profile-gray": "profile-gray",
  add: "add",
  user: "profile",
  back: "back",
  search: "search",
  edit: "edit",
  delete: "delete",
  "delete-red": "delete-red",
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
  monitor: "monitor",
  info: "info",
  "switch-account": "switch-account",
  sun: "sun",
  moon: "moon",
  clock: "clock",
  workbench: "workbench",
  "workbench-gray": "workbench-gray",
};

/** mask 模式用彩色版 SVG（去掉 -gray / 红删除特例） */
function resolveFile(name: IconName, forMask: boolean): string {
  if (!forMask) return FILE_MAP[name] || "home";
  if (name === "delete-red") return "delete";
  const base = name.replace(/-gray$/, "") as IconName;
  return FILE_MAP[base] || FILE_MAP[name] || "home";
}

export default function Icon({
  name,
  size = 56,
  color,
  className = "",
}: IconProps) {
  const s = size;
  const rotate = name === "chevron-right" ? "rotate(-90deg)" : undefined;
  const svgPath = `/assets/icons/${resolveFile(name, Boolean(color))}.svg`;

  if (color) {
    return (
      <View
        className={`ui-icon ui-icon--mask ${className}`.trim()}
        style={{
          width: `${s}rpx`,
          height: `${s}rpx`,
          backgroundColor: color,
          WebkitMaskImage: `url(${svgPath})`,
          maskImage: `url(${svgPath})`,
          transform: rotate,
        }}
      />
    );
  }

  return (
    <View
      className={`ui-icon ${className}`.trim()}
      style={{
        width: `${s}rpx`,
        height: `${s}rpx`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transform: rotate,
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
