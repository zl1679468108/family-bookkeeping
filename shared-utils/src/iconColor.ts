/**
 * 线框图标语义色 — 映射 design tokens CSS 变量
 * PC / Taro Icon 组件共用，避免端侧字符串漂移
 */
export const ICON_COLOR = {
  primary: 'var(--pr)',
  muted: 'var(--fg3)',
  fg: 'var(--fg)',
  danger: 'var(--exp)',
  warn: 'var(--warn)',
  onPrimary: 'var(--on-pr)',
} as const

export type IconColorKey = keyof typeof ICON_COLOR
