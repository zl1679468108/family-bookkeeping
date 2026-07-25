/**
 * 线框导航/UI 图标 — 纯 SVG 规格（viewBox 0 0 24 24）
 * PC Icon 用 React 渲染；Taro 可用 buildLineIconSvgString / data URL
 */

export type LineIconName =
  | 'dashboard'
  | 'home'
  | 'transactions'
  | 'add'
  | 'budgets'
  | 'reports'
  | 'annual-report'
  | 'note'
  | 'books'
  | 'calendar'
  | 'templates'
  | 'categories'
  | 'map'
  | 'location'
  | 'user'
  | 'users'
  | 'switch-account'
  | 'info'
  | 'logout'
  | 'close'
  | 'edit'
  | 'delete'
  | 'email'
  | 'lock'
  | 'clock'
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
      { tag: 'path', attrs: { d: 'M12 16v-4' } },
      // 顶部圆点用实心圆，避免极短线在小程序 mask 中消失
      { tag: 'circle', attrs: { cx: 12, cy: 8, r: 1, fill: 'currentColor', stroke: 'none' } },
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
  'home': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' } },
      { tag: 'polyline', attrs: { points: '9 22 9 12 15 12 15 22' } },
    ],
  },
  'note': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
      { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
      { tag: 'line', attrs: { x1: 16, y1: 13, x2: 8, y2: 13 } },
      { tag: 'line', attrs: { x1: 16, y1: 17, x2: 8, y2: 17 } },
    ],
  },
  'location': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' } },
      { tag: 'circle', attrs: { cx: 12, cy: 10, r: 3 } },
    ],
  },
  'switch-account': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' } },
      { tag: 'circle', attrs: { cx: 9, cy: 7, r: 4 } },
      { tag: 'line', attrs: { x1: 19, y1: 8, x2: 19, y2: 14 } },
      { tag: 'line', attrs: { x1: 22, y1: 11, x2: 16, y2: 11 } },
    ],
  },
  'edit': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' } },
      { tag: 'path', attrs: { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' } },
    ],
  },
  'delete': {
    ...VB,
    children: [
      { tag: 'polyline', attrs: { points: '3 6 5 6 21 6' } },
      { tag: 'path', attrs: { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' } },
    ],
  },
  'email': {
    ...VB,
    children: [
      { tag: 'path', attrs: { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' } },
      { tag: 'polyline', attrs: { points: '22 6 12 13 2 6' } },
    ],
  },
  'lock': {
    ...VB,
    children: [
      { tag: 'rect', attrs: { x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 } },
      { tag: 'path', attrs: { d: 'M7 11V7a5 5 0 0 1 10 0v4' } },
    ],
  },
  'clock': {
    ...VB,
    children: [
      { tag: 'circle', attrs: { cx: 12, cy: 12, r: 10 } },
      { tag: 'polyline', attrs: { points: '12 8 12 12 14 14' } },
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

/** React 用 camelCase；SVG XML / data URL 必须 kebab-case，否则 stroke-linecap 等会失效 */
const toSvgXmlAttrName = (key: string): string =>
  key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)

export function buildLineIconSvgString(
  name: LineIconName,
  color: string = 'currentColor',
  strokeWidth = 2,
): string {
  const spec = getLineIconSpec(name)
  // 必须用 SVG 标准属性名：camelCase 在 data URL 中会被忽略，
  // 导致 info 图标顶部圆点（依赖 stroke-linecap=round 的极短线）消失
  const common: Record<string, string | number> = {
    fill: 'none',
    stroke: color,
    'stroke-width': strokeWidth,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  }
  const childrenXml = spec.children
    .map((child) => {
      const merged: Record<string, string | number> = { ...common }
      for (const [k, v] of Object.entries(child.attrs)) {
        const key = toSvgXmlAttrName(k)
        // data URL 无法解析 currentColor，替换为实际着色
        merged[key] = v === 'currentColor' ? color : (v as string | number)
      }
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
 * 未列出的专用资产才回退端侧 /assets/icons/*.svg
 * 注意：真机 custom-tab-bar 下 mask-image 用包内相对路径常失效，Tab 图标务必走 data URL 线框
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
  // 四宫格：与 workbench.svg / dashboard 几何一致；避免 Tab 走本地 SVG mask（开发者工具可见、真机空白）
  workbench: 'dashboard',
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

