// 账本图标定义 —— 纯 TS 数据/工具文件（不含 JSX 字面量）
// 使用 React.createElement 动态构造 SVG，以便从 .ts 文件生成 ReactNode。
import * as React from 'react';

export interface BookIconItem {
  key: string;
  label: string;
}

// 账本图标列表（只含 key/label 数据，不含 JSX）
export const BOOK_ICONS: BookIconItem[] = [
  { key: 'default', label: '账本' },
  { key: 'money', label: '财富' },
  { key: 'home', label: '家庭' },
  { key: 'family', label: '家人' },
  { key: 'car', label: '交通' },
  { key: 'travel', label: '旅行' },
  { key: 'food', label: '美食' },
  { key: 'shopping', label: '购物' },
  { key: 'health', label: '健康' },
  { key: 'movie', label: '电影' },
  { key: 'game', label: '游戏' },
  { key: 'phone', label: '数码' },
  { key: 'computer', label: '电脑' },
  { key: 'camera', label: '摄影' },
  { key: 'music', label: '音乐' },
  { key: 'soccer', label: '足球' },
  { key: 'basketball', label: '篮球' },
  { key: 'target', label: '目标' },
  { key: 'art', label: '艺术' },
  { key: 'note', label: '笔记' },
];

// SVG 路径数据，供 JSX 渲染层使用
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
  money: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'line', attrs: { x1: 12, y1: 1, x2: 12, y2: 23 } },
      { tag: 'path', attrs: { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' } },
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
  car: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 1, y: 17, width: 15, height: 6, rx: 2 } },
      { tag: 'circle', attrs: { cx: 5, cy: 20, r: 1.5 } },
      { tag: 'circle', attrs: { cx: 12, cy: 20, r: 1.5 } },
      { tag: 'path', attrs: { d: 'M17 8h4v8h-2' } },
      { tag: 'path', attrs: { d: 'M17 16.5c-1.3 0-3.5-.5-4-1.5' } },
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
  health: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' } },
      { tag: 'path', attrs: { d: 'M9 12l2 2 4-4' } },
    ],
  },
  movie: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 2, y: 3, width: 20, height: 14, rx: 2 } },
      { tag: 'path', attrs: { d: 'M8 21h8M12 17v4' } },
      { tag: 'path', attrs: { d: 'M4 10l4-3 4 3 4-3 4 3' } },
    ],
  },
  game: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 6, y: 11, width: 12, height: 11, rx: 2 } },
      { tag: 'circle', attrs: { cx: 9, cy: 14, r: 1.5 } },
      { tag: 'circle', attrs: { cx: 15, cy: 14, r: 1.5 } },
      { tag: 'path', attrs: { d: 'M9 18h6' } },
      { tag: 'circle', attrs: { cx: 8, cy: 6, r: 4 } },
      { tag: 'circle', attrs: { cx: 16, cy: 6, r: 4 } },
    ],
  },
  phone: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 5, y: 2, width: 14, height: 20, rx: 2 } },
      { tag: 'path', attrs: { d: 'M12 18h.01' } },
    ],
  },
  computer: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'rect', attrs: { x: 4, y: 4, width: 16, height: 14, rx: 2 } },
      { tag: 'line', attrs: { x1: 20, y1: 12, x2: 24, y2: 12 } },
      { tag: 'line', attrs: { x1: 16, y1: 22, x2: 8, y2: 22 } },
      { tag: 'line', attrs: { x1: 4, y1: 12, x2: 0, y2: 12 } },
    ],
  },
  camera: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' } },
      { tag: 'circle', attrs: { cx: 12, cy: 13, r: 4 } },
    ],
  },
  music: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M9 18V5l12-2v13' } },
      { tag: 'circle', attrs: { cx: 6, cy: 18, r: 3 } },
      { tag: 'circle', attrs: { cx: 18, cy: 16, r: 3 } },
    ],
  },
  soccer: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'path', attrs: { d: 'M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20' } },
      { tag: 'path', attrs: { d: 'M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20' } },
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 4 } },
    ],
  },
  basketball: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'path', attrs: { d: 'M12 2v20M2 12h20' } },
      { tag: 'path', attrs: { d: 'M17 5l-5 5-5-5M17 19l-5-5-5 5' } },
    ],
  },
  target: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 6 } },
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 2 } },
      { tag: 'path', attrs: { d: 'M22 12l-4 4-4-4-4-4-4 4' } },
    ],
  },
  art: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M12 20h9' } },
      { tag: 'path', attrs: { d: 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' } },
    ],
  },
  note: {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    children: [
      { tag: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
      { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
      { tag: 'line', attrs: { x1: 16, y1: 13, x2: 8, y2: 13 } },
      { tag: 'line', attrs: { x1: 16, y1: 17, x2: 8, y2: 17 } },
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
    money: '💰',
    home: '🏠',
    family: '👨‍👩‍👧',
    car: '🚗',
    travel: '✈️',
    food: '🍔',
    shopping: '🛒',
    health: '💊',
    movie: '🎬',
    game: '🎮',
    phone: '📱',
    computer: '💻',
    camera: '📷',
    music: '🎵',
    soccer: '⚽',
    basketball: '🏀',
    target: '🎯',
    art: '🎨',
    note: '📝',
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

/**
 * 将 SVG 规格渲染为 ReactNode（使用 React.createElement，避免 JSX）。
 * 在 icon-grid、bk-icon、detail-icon 等地方调用此函数得到 ReactNode。
 */
const SVG_STYLE_PROPS = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const renderSvgChildren = (spec: BookIconSvgSpec): React.ReactNode =>
  spec.children.map((child, idx) =>
    React.createElement(child.tag as keyof JSX.IntrinsicElements, {
      key: `${child.tag}-${idx}`,
      ...child.attrs,
    })
  );

export const renderBookIcon = (iconKey?: string): React.ReactNode => {
  const spec = getBookIconSpecByKey(iconKey);
  return React.createElement(
    'svg',
    {
      width: spec.width,
      height: spec.height,
      viewBox: spec.viewBox,
      ...SVG_STYLE_PROPS,
    },
    renderSvgChildren(spec)
  );
};

/**
 * 向后兼容：导出 getBookIconByKey（返回 ReactNode，可直接在 JSX 中使用）
 */
export const getBookIconByKey = (iconKey?: string): React.ReactNode => renderBookIcon(iconKey);
