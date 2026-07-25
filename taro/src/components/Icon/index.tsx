/**
 * Icon — 线框优先 + 本地 SVG 回退
 *
 * 渲染策略：
 * 1. 可映射到 shared lineIcons 的名称 → data URL（与 PC 几何一致）
 *    - 传入 color：CSS mask + backgroundColor（支持主题色/暗色）
 *    - 未传 color：Image 渲染描边色 SVG
 * 2. 无法映射的专用图标 → /assets/icons/*.svg
 *    注意：真机 mask-image 对包内路径支持差；Tab/需要 color 的图标优先走 lineIcons data URL
 */
import { View, Image } from "@tarojs/components";
import "./index.scss";
export { ICON_COLOR } from "../../utils/iconColor";
import {
  resolveTaroLineIconName,
  getLineIconSvgDataUrl,
} from "../../utils/lineIcons";
import { buildUiIconClassName } from "../../utils/uiIcon";
import { THEME_TOKEN_HEX } from "../../utils/themeTokens";
import { STORAGE_THEME_TARO } from "../../utils/storageKeys";
import Taro from "@tarojs/taro";

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
  /** 动态着色；不传则使用 SVG 内嵌色 / 默认主题色 */
  color?: string;
  className?: string;
}

/** 语义色快捷，避免业务层硬编码 hex */

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


function defaultLineStrokeColor(): string {
  try {
    const stored = Taro.getStorageSync(STORAGE_THEME_TARO);
    return stored === "dark" ? THEME_TOKEN_HEX.dark.fg : THEME_TOKEN_HEX.light.fg;
  } catch {
    return THEME_TOKEN_HEX.light.fg;
  }
}

export default function Icon({
  name,
  size = 56,
  color,
  className = "",
}: IconProps) {
  const s = size;
  const lineName = resolveTaroLineIconName(name);
  // 线框规格自带 chevron-right，无需再旋转 down
  const rotate =
    !lineName && name === "chevron-right" ? "rotate(-90deg)" : undefined;

  if (lineName) {
    if (color) {
      const maskUrl = getLineIconSvgDataUrl(lineName, "#000000");
      return (
        <View
          className={buildUiIconClassName({ mask: true, className })}
          style={{
            width: `${s}rpx`,
            height: `${s}rpx`,
            backgroundColor: color,
            WebkitMaskImage: `url("${maskUrl}")`,
            maskImage: `url("${maskUrl}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            transform: rotate,
          }}
        />
      );
    }

    const svgUrl = getLineIconSvgDataUrl(lineName, defaultLineStrokeColor());
    return (
      <View
        className={buildUiIconClassName({ className })}
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
          src={svgUrl}
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

  const svgPath = `/assets/icons/${resolveFile(name, Boolean(color))}.svg`;

  // 本地 SVG + color：补齐 mask 属性；真机对包内路径 mask 仍可能空白，优先把图标收进 lineIcons
  if (color) {
    return (
      <View
        className={buildUiIconClassName({ mask: true, className })}
        style={{
          width: `${s}rpx`,
          height: `${s}rpx`,
          backgroundColor: color,
          WebkitMaskImage: `url("${svgPath}")`,
          maskImage: `url("${svgPath}")`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          transform: rotate,
        }}
      />
    );
  }

  return (
    <View
      className={buildUiIconClassName({ className })}
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
