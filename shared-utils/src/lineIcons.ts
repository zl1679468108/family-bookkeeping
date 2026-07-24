/**
 * 线框导航/UI 图标 — 纯 SVG 规格（viewBox 0 0 24 24）
 * PC Icon 用 React 渲染；Taro 可用 buildLineIconSvgString / data URL
 */

export type LineIconName =
  | 'dashboard'
  | 'transactions'
  | 'add'
  | 'budgets'
  | 'reports'
  | 'annual-report'
  | 'books'
  | 'calendar'
  | 'templates'
  | 'categories'
  | 'map'
  | 'user'
  | 'users'
  | 'info'
  | 'logout'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'search'
  | 'settings'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-transactions'
  | 'sun'
  | 'moon'
  | 'monitor'

export type LineIconChild = {
  tag: 'path' | 'line' | 'polyline' | 'circle' | 'rect' | 'polygon'
  attrs: Record<string, string | number>
}

export type LineIconSpec = {
  width: number
  height: number
  viewBox: string
  children: LineIconChild[]
}

const VB = { width: 24, height: 24, viewBox: '0 0 24 24' as const }

export const LINE_ICON_SVG_MAP: Record<LineIconName, LineIconSpec> = {
  'dashboard': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 3, y: 3, width: 7, height: 7, rx: 1 } },
      { tag: 'rect', attrs: { x: 14, y: 3, width: 7, height: 7, rx: 1 } },
      { tag: 'rect', attrs: { x: 3, y: 14, width: 7, height: 7, rx: 1 } },
      { tag: 'rect', attrs: { x: 14, y: 14, width: 7, height: 7, rx: 1 } },
    ],
  },
  'transactions': {
    ...VB,
    children: [
      { tag: 'line', attrs: { x1: 8, y1: 6, x2: 21, y2: 6 } },
      { tag: 'line', attrs: { x1: 8, y1: 12, x2: 21, y2: 12 } },
      { tag: 'line', attrs: { x1: 8, y1: 18, x2: 21, y2: 18 } },
      { tag: 'line', attrs: { x1: 3, y1: 6, x2: 3.01, y2: 6 } },
      { tag: 'line', attrs: { x1: 3, y1: 12, x2: 3.01, y2: 12 } },
      { tag: 'line', attrs: { x1: 3, y1: 18, x2: 3.01, y2: 18 } },
    ],
  },
  'add': {
    ...VB,
    children: [
      { tag: 'line', attrs: { x1: 12, y1: 5, x2: 12, y2: 19 } },
      { tag: 'line', attrs: { x1: 5, y1: 12, x2: 19, y2: 12 } },
    ],
  },
  'budgets': {
    ...VB,
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'polyline', attrs: { points: '12 6 12 12 16 14' } },
    ],
  },
  'reports': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M21.21 15.89A10 10 0 1 1 8 2.83' } },
      { tag: 'path', attrs: { d: 'M22 12A10 10 0 0 0 12 2v10z' } },
    ],
  },
  'annual-report': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
      { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
      { tag: 'line', attrs: { x1: 16, y1: 13, x2: 8, y2: 13 } },
      { tag: 'line', attrs: { x1: 16, y1: 17, x2: 8, y2: 17 } },
    ],
  },
  'books': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' } },
      { tag: 'path', attrs: { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' } },
    ],
  },
  'calendar': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 3, y: 4, width: 18, height: 18, rx: 2 } },
      { tag: 'line', attrs: { x1: 16, y1: 2, x2: 16, y2: 6 } },
      { tag: 'line', attrs: { x1: 8, y1: 2, x2: 8, y2: 6 } },
      { tag: 'line', attrs: { x1: 3, y1: 10, x2: 21, y2: 10 } },
    ],
  },
  'templates': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 3, y: 3, width: 18, height: 18, rx: 2 } },
      { tag: 'line', attrs: { x1: 3, y1: 9, x2: 21, y2: 9 } },
      { tag: 'line', attrs: { x1: 9, y1: 21, x2: 9, y2: 9 } },
    ],
  },
  'categories': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 2, y: 7, width: 20, height: 14, rx: 2 } },
      { tag: 'path', attrs: { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' } },
    ],
  },
  'map': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z' } },
      { tag: 'line', attrs: { x1: 9, y1: 3, x2: 9, y2: 18 } },
      { tag: 'line', attrs: { x1: 15, y1: 6, x2: 15, y2: 21 } },
    ],
  },
  'user': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' } },
      { tag: 'circle', attrs: { cx: 12, cy: 7, r: 4 } },
    ],
  },
  'users': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
      { tag: 'circle', attrs: { cx: 9, cy: 7, r: 4 } },
      { tag: 'path', attrs: { d: 'M22 21v-2a4 4 0 0 0-3-3.87' } },
      { tag: 'path', attrs: { d: 'M16 3.13a4 4 0 0 1 0 7.75' } },
    ],
  },
  'info': {
    ...VB,
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'line', attrs: { x1: 12, y1: 16, x2: 12, y2: 12 } },
      { tag: 'line', attrs: { x1: 12, y1: 8, x2: 12.01, y2: 8 } },
    ],
  },
  'logout': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' } },
      { tag: 'polyline', attrs: { points: '16 17 21 12 16 7' } },
      { tag: 'line', attrs: { x1: 21, y1: 12, x2: 9, y2: 12 } },
    ],
  },
  'close': {
    ...VB,
    children: [
      { tag: 'line', attrs: { x1: 18, y1: 6, x2: 6, y2: 18 } },
      { tag: 'line', attrs: { x1: 6, y1: 6, x2: 18, y2: 18 } },
    ],
  },
  'eye': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' } },
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
    ],
  },
  'eye-off': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24' } },
      { tag: 'line', attrs: { x1: 1, y1: 1, x2: 23, y2: 23 } },
    ],
  },
  'chevron-left': {
    ...VB,
    children: [
      { tag: 'polyline', attrs: { points: '15 18 9 12 15 6' } },
    ],
  },
  'chevron-right': {
    ...VB,
    children: [
      { tag: 'polyline', attrs: { points: '9 18 15 12 9 6' } },
    ],
  },
  'chevron-down': {
    ...VB,
    children: [
      { tag: 'polyline', attrs: { points: '6 9 12 15 18 9' } },
    ],
  },
  'search': {
    ...VB,
    children: [
      { tag: 'circle', attrs: { cx: 11, cy: 11, r: 8 } },
      { tag: 'line', attrs: { x1: 21, y1: 21, x2: 16.65, y2: 16.65 } },
    ],
  },
  'settings': {
    ...VB,
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 3 } },
      { tag: 'path', attrs: { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' } },
    ],
  },
  'admin-dashboard': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 3, y: 3, width: 7, height: 7, rx: 1 } },
      { tag: 'rect', attrs: { x: 14, y: 3, width: 7, height: 7, rx: 1 } },
      { tag: 'rect', attrs: { x: 3, y: 14, width: 7, height: 7, rx: 1 } },
      { tag: 'rect', attrs: { x: 14, y: 14, width: 7, height: 7, rx: 1 } },
    ],
  },
  'admin-users': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
      { tag: 'circle', attrs: { cx: 9, cy: 7, r: 4 } },
      { tag: 'path', attrs: { d: 'M22 21v-2a4 4 0 0 0-3-3.87' } },
      { tag: 'path', attrs: { d: 'M16 3.13a4 4 0 0 1 0 7.75' } },
    ],
  },
  'admin-transactions': {
    ...VB,
    children: [
      { tag: 'line', attrs: { x1: 8, y1: 6, x2: 21, y2: 6 } },
      { tag: 'line', attrs: { x1: 8, y1: 12, x2: 21, y2: 12 } },
      { tag: 'line', attrs: { x1: 8, y1: 18, x2: 21, y2: 18 } },
      { tag: 'line', attrs: { x1: 3, y1: 6, x2: 3.01, y2: 6 } },
      { tag: 'line', attrs: { x1: 3, y1: 12, x2: 3.01, y2: 12 } },
      { tag: 'line', attrs: { x1: 3, y1: 18, x2: 3.01, y2: 18 } },
    ],
  },
  'sun': {
    ...VB,
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 4 } },
      { tag: 'line', attrs: { x1: 12, y1: 2, x2: 12, y2: 4 } },
      { tag: 'line', attrs: { x1: 12, y1: 20, x2: 12, y2: 22 } },
      { tag: 'line', attrs: { x1: 4.93, y1: 4.93, x2: 6.34, y2: 6.34 } },
      { tag: 'line', attrs: { x1: 17.66, y1: 17.66, x2: 19.07, y2: 19.07 } },
      { tag: 'line', attrs: { x1: 2, y1: 12, x2: 4, y2: 12 } },
      { tag: 'line', attrs: { x1: 20, y1: 12, x2: 22, y2: 12 } },
      { tag: 'line', attrs: { x1: 4.93, y1: 19.07, x2: 6.34, y2: 17.66 } },
      { tag: 'line', attrs: { x1: 17.66, y1: 6.34, x2: 19.07, y2: 4.93 } },
    ],
  },
  'moon': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' } },
    ],
  },
  'monitor': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 2, y: 3, width: 20, height: 14, rx: 2 } },
      { tag: 'line', attrs: { x1: 8, y1: 21, x2: 16, y2: 21 } },
      { tag: 'line', attrs: { x1: 12, y1: 17, x2: 12, y2: 21 } },
    ],
  },
}

export function isLineIconName(name: string): name is LineIconName {
  return Object.prototype.hasOwnProperty.call(LINE_ICON_SVG_MAP, name)
}

export function getLineIconSpec(name: LineIconName): LineIconSpec {
  return LINE_ICON_SVG_MAP[name] ?? LINE_ICON_SVG_MAP['info']
}

const escapeXmlAttr = (v: string | number): string =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export function buildLineIconSvgString(
  name: LineIconName,
  color: string = 'currentColor',
  strokeWidth = 2,
): string {
  const spec = getLineIconSpec(name)
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  const childrenXml = spec.children
    .map((child) => {
      const merged = { ...common, ...child.attrs }
      const attrStr = Object.entries(merged)
        .map(([k, v]) => `${k}="${escapeXmlAttr(v)}"`)
        .join(' ')
      return `<${child.tag} ${attrStr}/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="${spec.viewBox}">${childrenXml}</svg>`
}

export function getLineIconSvgDataUrl(
  name: LineIconName,
  color: string = '#1A1C19',
  strokeWidth = 2,
): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildLineIconSvgString(name, color, strokeWidth))}`
}

/**
 * Taro IconName → LineIconName 别名（仅几何可复用的线框图标）
 * 不映射 home/workbench/clock 等小程序专用资产
 */
export const TARO_LINE_ICON_ALIASES: Record<string, LineIconName> = {
  statistics: 'reports',
  profile: 'user',
  back: 'chevron-left',
  annual: 'annual-report',
  book: 'books',
  budget: 'budgets',
  category: 'categories',
  template: 'templates',
}

/**
 * 解析 Taro / 通用图标名到线框规格名；无法复用返回 null（走端侧本地资源）
 */
export function resolveTaroLineIconName(name: string): LineIconName | null {
  const raw = String(name || '').trim()
  if (!raw) return null
  const base = raw.replace(/-gray$/, '').replace(/-red$/, '')
  if (isLineIconName(base)) return base
  const aliased = TARO_LINE_ICON_ALIASES[base]
  return aliased && isLineIconName(aliased) ? aliased : null
}

