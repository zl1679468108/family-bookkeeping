/**
 * 账本图标 — 双端共享纯数据与 SVG 工具
 * - BOOK_ICONS / BOOK_ICON_SVG_MAP：图标 key 与 SVG 规格
 * - getBookIconSpecByKey / isBookIconKey / isCustomIconUrl
 * - getBookEmoji*：emoji 回退
 * - buildBookIconSvgString / getBookIconSvgDataUrl：小程序 Image 或通用 data URL
 *
 * 端侧渲染：
 * - PC：React.createElement 包装（frontend/src/utils/bookIcons.ts）
 * - Taro：data URL + <Image>（taro/src/utils/bookIcons.ts 再导出）
 */

export interface BookIconItem {
  key: string;
  label: string;
}

// 账本图标列表（日常生活大类）
export const BOOK_ICONS: BookIconItem[] = [
  { key: 'default', label: '账本' },
  { key: 'home', label: '居家' },
  { key: 'work', label: '工作' },
  { key: 'study', label: '学习' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'health', label: '健康' },
  { key: 'travel', label: '旅行' },
  { key: 'food', label: '餐饮' },
  { key: 'shopping', label: '购物' },
  { key: 'sports', label: '运动' },
  { key: 'social', label: '社交' },
  { key: 'family', label: '家庭' },
  { key: 'pet', label: '宠物' },
  { key: 'car', label: '交通' },
  { key: 'investment', label: '投资' },
  { key: 'gift', label: '礼物' },
];

// SVG 路径数据，供端侧渲染层使用
export interface BookIconSvgSpec {
  width: number;
  height: number;
  viewBox: string;
  children: Array<{
    tag: 'path' | 'line' | 'polyline' | 'circle' | 'rect' | 'polygon';
    attrs: Record<string, string | number>;
  }>;
}

export const BOOK_ICON_SVG_MAP: Record<string, BookIconSvgSpec> = {
  default: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' } },
      { tag: 'path', attrs: { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' } },
    ],
  },
  home: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z' } },
      { tag: 'polyline', attrs: { points: '9 22 9 12 15 12 15 22' } },
    ],
  },
  work: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 2, y: 7, width: 20, height: 14, rx: 2 } },
      { tag: 'path', attrs: { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' } },
    ],
  },
  study: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' } },
      { tag: 'path', attrs: { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' } },
    ],
  },
  entertainment: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'path', attrs: { d: 'M8 14s1.5 2 4 2 4-2 4-2' } },
      { tag: 'line', attrs: { x1: 9, y1: 9, x2: 9.01, y2: 9 } },
      { tag: 'line', attrs: { x1: 15, y1: 9, x2: 15.01, y2: 9 } },
    ],
  },
  health: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' } },
      { tag: 'path', attrs: { d: 'M9 12l2 2 4-4' } },
    ],
  },
  travel: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.1.6l-.3 1.4c-.1.5.1 1 .6 1.1L10 12l-1 3H4c-.5 0-1 .4-1 1s.4 1 1 1h5l1.5 2.5c.2.3.6.4.9.2l3.5-2 4.5 1.8c.5.2 1-.1 1.1-.6l.4-1.4c.2-.5-.1-1-.6-1.2z' } },
    ],
  },
  food: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
      { tag: 'path', attrs: { d: 'M12 3v14M7 15l5-5 5 5' } },
    ],
  },
  shopping: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 9, cy: 21, r: 1 } },
      { tag: 'circle', attrs: { cx: 20, cy: 21, r: 1 } },
      { tag: 'path', attrs: { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6' } },
    ],
  },
  sports: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'path', attrs: { d: 'M12 2v20M2 12h20' } },
    ],
  },
  social: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 5, r: 3 } },
      { tag: 'circle', attrs: { cx: 5, cy: 19, r: 3 } },
      { tag: 'circle', attrs: { cx: 19, cy: 19, r: 3 } },
      { tag: 'line', attrs: { x1: 12, y1: 8, x2: 12, y2: 16 } },
      { tag: 'line', attrs: { x1: 7, y1: 17, x2: 10, y2: 15 } },
      { tag: 'line', attrs: { x1: 14, y1: 15, x2: 17, y2: 17 } },
    ],
  },
  family: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 7, r: 4 } },
      { tag: 'path', attrs: { d: 'M12 17v7' } },
      { tag: 'path', attrs: { d: 'M8 21h8' } },
      { tag: 'circle', attrs: { cx: 6, cy: 17, r: 2 } },
      { tag: 'circle', attrs: { cx: 18, cy: 17, r: 2 } },
    ],
  },
  pet: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
      { tag: 'circle', attrs: { cx: 7, cy: 7, r: 2 } },
      { tag: 'circle', attrs: { cx: 17, cy: 7, r: 2 } },
      { tag: 'circle', attrs: { cx: 7, cy: 17, r: 2 } },
      { tag: 'circle', attrs: { cx: 17, cy: 17, r: 2 } },
    ],
  },
  car: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 1, y: 17, width: 15, height: 6, rx: 2 } },
      { tag: 'circle', attrs: { cx: 5, cy: 20, r: 1.5 } },
      { tag: 'circle', attrs: { cx: 12, cy: 20, r: 1.5 } },
      { tag: 'path', attrs: { d: 'M17 8h4v8h-2' } },
    ],
  },
  investment: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'polyline', attrs: { points: '23 6 13.5 15.5 8.5 10.5 1 18' } },
      { tag: 'polyline', attrs: { points: '17 6 23 6 23 12' } },
    ],
  },
  gift: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'polyline', attrs: { points: '20 12 20 22 4 22 4 12' } },
      { tag: 'rect', attrs: { x: 2, y: 7, width: 20, height: 5 } },
      { tag: 'line', attrs: { x1: 12, y1: 22, x2: 12, y2: 7 } },
      { tag: 'path', attrs: { d: 'M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z' } },
      { tag: 'path', attrs: { d: 'M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' } },
    ],
  },
};

/**
 * 根据 icon key 获取对应的图标规格；找不到时返回默认账本图标。
 */
export const getBookIconSpecByKey = (iconKey?: string): BookIconSvgSpec => {
  if (!iconKey) return BOOK_ICON_SVG_MAP.default;
  return BOOK_ICON_SVG_MAP[iconKey] || BOOK_ICON_SVG_MAP.default;
};

/**
 * 兼容旧的 emoji 获取方式（保持向后兼容）
 */
export const getBookEmojiByKey = (iconKey?: string): string => {
  const emojiMap: Record<string, string> = {
    default: '📚',
    home: '🏠',
    work: '💼',
    study: '📖',
    entertainment: '🎮',
    health: '💊',
    travel: '✈️',
    food: '🍔',
    shopping: '🛒',
    sports: '⚽',
    social: '🤝',
    family: '👨‍👩‍👧',
    pet: '🐾',
    car: '🚗',
    investment: '📈',
    gift: '🎁',
  };
  return emojiMap[iconKey || 'default'] || '📚';
};

/**
 * 根据账本 ID 获取对应的图标
 */
export const getBookEmoji = (bookId?: string): string => {
  if (!bookId) return '📚';
  const index = bookId.charCodeAt(bookId.length - 1) % BOOK_ICONS.length;
  return getBookEmojiByKey(BOOK_ICONS[index].key);
};

/**
 * 获取账本图标（优先使用 icon 字段，否则使用 ID 计算）
 */
export const getBookEmojiByIconOrId = (iconKey?: string, bookId?: string): string => {
  if (iconKey && iconKey !== 'default') {
    return getBookEmojiByKey(iconKey);
  }
  return getBookEmoji(bookId);
};

/** 自定义上传图标 URL */
export const isCustomIconUrl = (icon?: string): boolean => {
  if (!icon) return false
  return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('//')
}

/** 是否为内置账本图标 key */
export const isBookIconKey = (icon?: string): boolean => {
  if (!icon || isCustomIconUrl(icon)) return false
  return !!BOOK_ICON_SVG_MAP[icon]
}

const escapeXmlAttr = (value: string | number): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const buildSvgChildrenXml = (
  children: BookIconSvgSpec['children'],
  commonAttrs: Record<string, string | number>,
): string =>
  children
    .map((child) => {
      const merged = { ...commonAttrs, ...child.attrs }
      const attrStr = Object.entries(merged)
        .map(([k, v]) => `${k}="${escapeXmlAttr(v)}"`)
        .join(' ')
      return `<${child.tag} ${attrStr}/>`
    })
    .join('')

/**
 * 根据 key 生成完整 SVG 字符串
 * strokeWidth 默认 2（与 PC 端一致）
 */
export const buildBookIconSvgString = (
  iconKey?: string,
  color = '#1a1c19',
  strokeWidth = 2,
): string => {
  const spec = getBookIconSpecByKey(iconKey)
  const commonAttrs = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  const childrenXml = buildSvgChildrenXml(spec.children, commonAttrs)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="${spec.viewBox}">${childrenXml}</svg>`
}

const svgToDataUrl = (svgStr: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`

/**
 * 根据 key 获取账本图标 data:image/svg+xml URL
 * 调用方：<Image src={getBookIconSvgDataUrl("home")} />
 */
export const getBookIconSvgDataUrl = (
  iconKey?: string,
  color = '#1a1c19',
): string => {
  if (isCustomIconUrl(iconKey)) return iconKey as string
  return svgToDataUrl(buildBookIconSvgString(iconKey, color))
}
