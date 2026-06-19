/**
 * 账本图标 —— 与 PC 端 frontend/src/utils/bookIcons.ts 保持一致
 * - BOOK_ICONS / BOOK_ICON_SVG_MAP：与 PC 端完全相同的图标 key 与 SVG 路径数据
 * - getBookIconSvgDataUrl(iconKey, color)：返回 SVG data:image/svg+xml URL
 * - isBookIconKey(icon)：判断是否为 PC 端定义的账本图标 key
 * - isCustomIconUrl(icon)：判断是否为自定义上传的 URL
 *
 * 调用方用法：<Image src={getBookIconSvgDataUrl("home")} mode="aspectFit" style={{width: 20, height: 20}}/>
 */

export interface BookIconItem {
  key: string;
  label: string;
}

// 账本图标列表（与 PC 端完全相同）
export const BOOK_ICONS: BookIconItem[] = [
  { key: "default", label: "账本" },
  { key: "home", label: "居家" },
  { key: "work", label: "工作" },
  { key: "study", label: "学习" },
  { key: "entertainment", label: "娱乐" },
  { key: "health", label: "健康" },
  { key: "travel", label: "旅行" },
  { key: "food", label: "餐饮" },
  { key: "shopping", label: "购物" },
  { key: "sports", label: "运动" },
  { key: "social", label: "社交" },
  { key: "family", label: "家庭" },
  { key: "pet", label: "宠物" },
  { key: "car", label: "交通" },
  { key: "investment", label: "投资" },
  { key: "gift", label: "礼物" },
];

// SVG 路径数据（与 PC 端完全相同）
export interface BookIconSvgSpec {
  width: number;
  height: number;
  viewBox: string;
  children: Array<{
    tag: "path" | "line" | "polyline" | "circle" | "rect" | "polygon";
    attrs: Record<string, string | number>;
  }>;
}

export const BOOK_ICON_SVG_MAP: Record<string, BookIconSvgSpec> = {
  default: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" } },
      { tag: "path", attrs: { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" } },
    ],
  },
  home: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" } },
      { tag: "polyline", attrs: { points: "9 22 9 12 15 12 15 22" } },
    ],
  },
  work: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "rect", attrs: { x: 2, y: 7, width: 20, height: 14, rx: 2 } },
      { tag: "path", attrs: { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" } },
    ],
  },
  study: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" } },
      { tag: "path", attrs: { d: "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" } },
    ],
  },
  entertainment: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: "path", attrs: { d: "M8 14s1.5 2 4 2 4-2 4-2" } },
      { tag: "line", attrs: { x1: 9, y1: 9, x2: 9.01, y2: 9 } },
      { tag: "line", attrs: { x1: 15, y1: 9, x2: 15.01, y2: 9 } },
    ],
  },
  health: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" } },
      { tag: "path", attrs: { d: "M9 12l2 2 4-4" } },
    ],
  },
  travel: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      {
        tag: "path",
        attrs: {
          d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.1.6l-.3 1.4c-.1.5.1 1 .6 1.1L10 12l-1 3H4c-.5 0-1 .4-1 1s.4 1 1 1h5l1.5 2.5c.2.3.6.4.9.2l3.5-2 4.5 1.8c.5.2 1-.1 1.1-.6l.4-1.4c.2-.5-.1-1-.6-1.2z",
        },
      },
    ],
  },
  food: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" } },
      { tag: "path", attrs: { d: "M12 3v14M7 15l5-5 5 5" } },
    ],
  },
  shopping: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "circle", attrs: { cx: 9, cy: 21, r: 1 } },
      { tag: "circle", attrs: { cx: 20, cy: 21, r: 1 } },
      { tag: "path", attrs: { d: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6" } },
    ],
  },
  sports: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "circle", attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: "path", attrs: { d: "M12 2v20M2 12h20" } },
    ],
  },
  social: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "circle", attrs: { cx: 12, cy: 5, r: 3 } },
      { tag: "circle", attrs: { cx: 5, cy: 19, r: 3 } },
      { tag: "circle", attrs: { cx: 19, cy: 19, r: 3 } },
      { tag: "line", attrs: { x1: 12, y1: 8, x2: 12, y2: 16 } },
      { tag: "line", attrs: { x1: 7, y1: 17, x2: 10, y2: 15 } },
      { tag: "line", attrs: { x1: 14, y1: 15, x2: 17, y2: 17 } },
    ],
  },
  family: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "circle", attrs: { cx: 12, cy: 7, r: 4 } },
      { tag: "path", attrs: { d: "M12 17v7" } },
      { tag: "path", attrs: { d: "M8 21h8" } },
      { tag: "circle", attrs: { cx: 6, cy: 17, r: 2 } },
      { tag: "circle", attrs: { cx: 18, cy: 17, r: 2 } },
    ],
  },
  pet: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "circle", attrs: { cx: 12, cy: 12, r: 3 } },
      { tag: "circle", attrs: { cx: 7, cy: 7, r: 2 } },
      { tag: "circle", attrs: { cx: 17, cy: 7, r: 2 } },
      { tag: "circle", attrs: { cx: 7, cy: 17, r: 2 } },
      { tag: "circle", attrs: { cx: 17, cy: 17, r: 2 } },
    ],
  },
  car: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "rect", attrs: { x: 1, y: 17, width: 15, height: 6, rx: 2 } },
      { tag: "circle", attrs: { cx: 5, cy: 20, r: 1.5 } },
      { tag: "circle", attrs: { cx: 12, cy: 20, r: 1.5 } },
      { tag: "path", attrs: { d: "M17 8h4v8h-2" } },
    ],
  },
  investment: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "polyline", attrs: { points: "23 6 13.5 15.5 8.5 10.5 1 18" } },
      { tag: "polyline", attrs: { points: "17 6 23 6 23 12" } },
    ],
  },
  gift: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "polyline", attrs: { points: "20 12 20 22 4 22 4 12" } },
      { tag: "rect", attrs: { x: 2, y: 7, width: 20, height: 5 } },
      { tag: "line", attrs: { x1: 12, y1: 22, x2: 12, y2: 7 } },
      { tag: "path", attrs: { d: "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" } },
      { tag: "path", attrs: { d: "M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" } },
    ],
  },
};

/**
 * 根据 icon key 获取 SVG 规格；找不到返回默认
 */
export const getBookIconSpecByKey = (iconKey?: string): BookIconSvgSpec => {
  if (!iconKey) return BOOK_ICON_SVG_MAP.default;
  return BOOK_ICON_SVG_MAP[iconKey] || BOOK_ICON_SVG_MAP.default;
};

/**
 * 判断是否为 URL 形式的自定义图标
 */
export const isCustomIconUrl = (icon?: string): boolean => {
  if (!icon) return false;
  return icon.startsWith("http://") || icon.startsWith("https://");
};

/**
 * 判断是否为 PC 端定义的账本图标 key
 */
export const isBookIconKey = (icon?: string): boolean => {
  if (!icon) return false;
  return !!BOOK_ICON_SVG_MAP[icon];
};

// ===================================================================
// SVG 字符串 / data URL 生成工具
// ===================================================================

const buildSvgChildrenXml = (
  children: BookIconSvgSpec["children"],
  commonAttrs: Record<string, string | number>,
): string => {
  return children
    .map((child) => {
      const merged = { ...commonAttrs, ...child.attrs };
      const attrStr = Object.entries(merged)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${child.tag} ${attrStr}/>`;
    })
    .join("");
};

/**
 * 根据 key 生成完整的 SVG 字符串（XML 格式）
 * strokeWidth 默认 2（与 PC 端一致）
 */
export const buildBookIconSvgString = (
  iconKey?: string,
  color: string = "#1a1c19",
  strokeWidth: number = 2,
): string => {
  const spec = getBookIconSpecByKey(iconKey);
  const commonAttrs = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const childrenXml = buildSvgChildrenXml(spec.children, commonAttrs);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="${spec.viewBox}">${childrenXml}</svg>`;
};

/**
 * 将 SVG 字符串编码为 data URL
 */
const svgToDataUrl = (svgStr: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
};

/**
 * 根据 key 获取账本图标的 data:image/svg+xml URL
 * 调用方：<Image src={getBookIconSvgDataUrl("home")} mode="aspectFit" style={{width: 20, height: 20}}/>
 */
export const getBookIconSvgDataUrl = (
  iconKey?: string,
  color: string = "#1a1c19",
): string => {
  return svgToDataUrl(buildBookIconSvgString(iconKey, color));
};

/**
 * 兼容导出：返回 Image src URL（替代 renderBookIconSvg）
 */
export const getBookIconByKey = (iconKey?: string): string =>
  getBookIconSvgDataUrl(iconKey);

/**
 * 与 PC 端 renderBookIcon 同名：返回 SVG data:image/svg+xml URL
 * 调用方：<Image src={renderBookIconSvg("home")} mode="aspectFit" style={{width: 20, height: 20}}/>
 */
export const renderBookIconSvg = (
  iconKey?: string,
  _size: number = 20,
  color: string = "#1a1c19",
): string => getBookIconSvgDataUrl(iconKey, color);
