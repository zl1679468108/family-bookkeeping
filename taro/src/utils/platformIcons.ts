/**
 * 购物平台及生活服务 SVG 图标预设 —— 与 PC 端一致
 * - SHOPPING_PLATFORM_ICONS / PLATFORM_SVG_MAP：与 PC 端完全相同的 key 与 SVG 路径数据
 * - getPlatformIconSvgDataUrl(key, color)：返回 SVG data:image/svg+xml URL
 * - isPlatformIcon(icon)：判断是否为 platform_ 前缀
 *
 * 调用方：<Image src={getPlatformIconSvgDataUrl("taobao")} mode="aspectFit" style={{width: 20, height: 20}}/>
 */

export interface PlatformIconItem {
  key: string;
  label: string;
}

// 购物平台及生活服务图标列表（与 PC 端完全相同）
export const SHOPPING_PLATFORM_ICONS: PlatformIconItem[] = [
  { key: "taobao", label: "淘宝" },
  { key: "tmall", label: "天猫" },
  { key: "jd", label: "京东" },
  { key: "pdd", label: "拼多多" },
  { key: "meituan", label: "美团" },
  { key: "douyin", label: "抖音" },
  { key: "gas_station", label: "加油站" },
  { key: "charging", label: "充电桩" },
  { key: "train_12306", label: "12306" },
  { key: "grocery", label: "买菜" },
  { key: "zhuanzhuan", label: "转转" },
  { key: "xianyu", label: "闲鱼" },
  { key: "rent", label: "租房" },
  { key: "taxi", label: "打车" },
];

// SVG 路径数据（与 PC 端完全相同）
export interface PlatformSvgSpec {
  width: number;
  height: number;
  viewBox: string;
  children: Array<{
    tag: "path" | "line" | "polyline" | "circle" | "rect" | "polygon";
    attrs: Record<string, string | number>;
  }>;
}

export const PLATFORM_SVG_MAP: Record<string, PlatformSvgSpec> = {
  taobao: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" } },
      { tag: "line", attrs: { x1: 3, y1: 6, x2: 21, y2: 6 } },
      { tag: "path", attrs: { d: "M16 10a4 4 0 01-8 0" } },
    ],
  },
  tmall: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      {
        tag: "path",
        attrs: {
          d: "M12 22c5 0 8-3.5 8-8 0-2-1-4-2-5l-2-4-2 2h-4l-2-2-2 4c-1 1-2 3-2 5 0 4.5 3 8 8 8z",
        },
      },
      { tag: "circle", attrs: { cx: 9, cy: 13, r: 1 } },
      { tag: "circle", attrs: { cx: 15, cy: 13, r: 1 } },
    ],
  },
  jd: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      {
        tag: "path",
        attrs: {
          d: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
        },
      },
      { tag: "polyline", attrs: { points: "3.27 6.96 12 12.01 20.73 6.96" } },
      { tag: "line", attrs: { x1: 12, y1: 22.08, x2: 12, y2: 12 } },
    ],
  },
  pdd: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "rect", attrs: { x: 3, y: 3, width: 7, height: 7, rx: 1 } },
      { tag: "rect", attrs: { x: 14, y: 3, width: 7, height: 7, rx: 1 } },
      { tag: "rect", attrs: { x: 3, y: 14, width: 7, height: 7, rx: 1 } },
      { tag: "rect", attrs: { x: 14, y: 14, width: 7, height: 7, rx: 1 } },
    ],
  },
  meituan: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M18 8h1a4 4 0 010 8h-1" } },
      { tag: "path", attrs: { d: "M5 8h13v9a4 4 0 01-4 4H9a4 4 0 01-4-4V8z" } },
      { tag: "line", attrs: { x1: 5, y1: 8, x2: 5, y2: 6 } },
      { tag: "line", attrs: { x1: 18, y1: 8, x2: 18, y2: 6 } },
      { tag: "path", attrs: { d: "M9 6a3 3 0 016 0" } },
    ],
  },
  douyin: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M9 18V5l12-2v13" } },
      { tag: "circle", attrs: { cx: 6, cy: 18, r: 3 } },
      { tag: "circle", attrs: { cx: 18, cy: 16, r: 3 } },
    ],
  },
  gas_station: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M3 22V6a2 2 0 012-2h8a2 2 0 012 2v16" } },
      { tag: "path", attrs: { d: "M15 10h2a2 2 0 012 2v3a2 2 0 002 2h0a2 2 0 002-2V9l-3-3" } },
      { tag: "rect", attrs: { x: 5, y: 8, width: 6, height: 5, rx: 1 } },
    ],
  },
  charging: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" } },
    ],
  },
  train_12306: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "rect", attrs: { x: 4, y: 3, width: 16, height: 14, rx: 2 } },
      { tag: "path", attrs: { d: "M4 11h16" } },
      { tag: "path", attrs: { d: "M12 3v8" } },
      { tag: "path", attrs: { d: "M8 21l-2-4" } },
      { tag: "path", attrs: { d: "M16 21l2-4" } },
      { tag: "circle", attrs: { cx: 8, cy: 15, r: 1 } },
      { tag: "circle", attrs: { cx: 16, cy: 15, r: 1 } },
    ],
  },
  grocery: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" } },
      { tag: "line", attrs: { x1: 3, y1: 6, x2: 21, y2: 6 } },
      { tag: "path", attrs: { d: "M16 10a4 4 0 01-8 0" } },
      { tag: "path", attrs: { d: "M8 2c0 2 2 3 4 3s4-1 4-3" } },
    ],
  },
  zhuanzhuan: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "polyline", attrs: { points: "23 4 23 10 17 10" } },
      { tag: "polyline", attrs: { points: "1 20 1 14 7 14" } },
      {
        tag: "path",
        attrs: {
          d: "M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
        },
      },
    ],
  },
  xianyu: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M6 12c0-4 3.5-7 8-7s8 3 8 7-3.5 7-8 7-8-3-8-7z" } },
      { tag: "path", attrs: { d: "M2 12c2-2 3-4 4-4s2 2 0 4 0 4-2 4-2-2-2-4z" } },
      { tag: "circle", attrs: { cx: 16, cy: 10, r: 1 } },
    ],
  },
  rent: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      {
        tag: "path",
        attrs: {
          d: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
        },
      },
    ],
  },
  taxi: {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    children: [
      { tag: "path", attrs: { d: "M5 17h14v-5l-2-5H7L5 12v5z" } },
      { tag: "circle", attrs: { cx: 7.5, cy: 17, r: 2 } },
      { tag: "circle", attrs: { cx: 16.5, cy: 17, r: 2 } },
      { tag: "path", attrs: { d: "M9 7h6" } },
      { tag: "path", attrs: { d: "M10 4h4v3h-4z" } },
    ],
  },
};

/**
 * 判断 key 是否为 platform_ 前缀（即 PC 端定义的购物平台图标）
 */
export const isPlatformIcon = (val?: string): boolean => {
  if (!val) return false;
  return val.startsWith("platform_");
};

// ===================================================================
// SVG 字符串 / data URL 生成工具
// ===================================================================

const buildSvgChildrenXml = (
  children: PlatformSvgSpec["children"],
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

export const buildPlatformIconSvgString = (
  key?: string,
  color: string = "#1a1c19",
  strokeWidth: number = 1.5,
): string => {
  if (!key) key = "taobao";
  const spec = PLATFORM_SVG_MAP[key] || PLATFORM_SVG_MAP.taobao;
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

const svgToDataUrl = (svgStr: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
};

/**
 * 根据 key 获取购物平台图标的 data:image/svg+xml URL
 */
export const getPlatformIconSvgDataUrl = (
  key: string,
  color: string = "#1a1c19",
): string => {
  return svgToDataUrl(buildPlatformIconSvgString(key, color));
};

/**
 * 兼容：导出 getPlatformIconByKey 返回 data URL
 */
export const getPlatformIconByKey = (key: string): string =>
  getPlatformIconSvgDataUrl(key);

/**
 * 与 PC 端一致的接口：返回 data:image/svg+xml URL
 * 调用方：<Image src={renderPlatformIconSvg("taobao", 20)} mode="aspectFit" style={{width: 20, height: 20}}/>
 */
export const renderPlatformIconSvg = (
  key: string,
  _size: number = 20,
  color: string = "#1a1c19",
): string => getPlatformIconSvgDataUrl(key, color);
