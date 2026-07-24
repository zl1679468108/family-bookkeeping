import { THEME_TOKEN_HEX } from './themeTokens'

/**
 * 地图 Marker HTML 纯函数（PC 高德 content 字符串）
 * 颜色由调用方注入，不依赖 DOM / getComputedStyle
 */

export interface MapMarkerTheme {
  srf: string
  fg: string
  fg3?: string
  info?: string
}

/** 成员位置气泡 */
export function createMemberBubbleHtml(
  username: string,
  isOffline: boolean,
  theme: MapMarkerTheme,
): string {
  const bgColor = isOffline ? (theme.fg3 || theme.fg) : (theme.info || theme.fg)
  const initial = username.charAt(0).toUpperCase()
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;">
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:${bgColor};
        border:2px solid ${theme.srf};box-shadow:0 2px 8px color-mix(in srgb, ${theme.fg} 28%, transparent);
        display:flex;align-items:center;justify-content:center;
        color:var(--on-pr);font-size:14px;font-weight:700;
        ${isOffline ? 'opacity:0.6;' : ''}
      ">${initial}</div>
      <span style="
        font-size:10px;color:${theme.fg};background:${theme.srf};
        padding:1px 6px;border-radius:8px;white-space:nowrap;
        max-width:80px;overflow:hidden;text-overflow:ellipsis;
        text-shadow:0 0 2px ${theme.srf};
      ">${username}</span>
    </div>
  `
}

export interface FootprintMarkerOptions {
  size?: number
  ring: string
  shadowFg: string
  onColor?: string
  /** 成员足迹：有 memberColor 时优先 */
  memberColor?: string
  memberInitial?: string
  /** 商户足迹 */
  merchantColor?: string
  merchantShortName?: string
}

/** 商户/成员足迹圆点 Marker */
export function createFootprintMarkerHtml(opts: FootprintMarkerOptions): string {
  const size = opts.size ?? 36
  const onColor = opts.onColor ?? 'var(--on-pr)'
  const ring = opts.ring
  const shadow = `0 2px 10px color-mix(in srgb, ${opts.shadowFg} 32%, transparent)`

  if (opts.memberColor) {
    const initial = opts.memberInitial ?? '?'
    return `
      <div style="
        width: ${size}px; height: ${size}px;
        border-radius: 50%; background: ${opts.memberColor};
        border: 3px solid ${ring}; box-shadow: ${shadow};
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: ${onColor}; font-size: 16px; font-weight: 700; white-space: nowrap;
      ">${initial}</div>
    `
  }

  const color = opts.merchantColor ?? THEME_TOKEN_HEX.light.fg3
  const shortName = opts.merchantShortName ?? ''
  return `
    <div style="
      width: ${size}px; height: ${size}px;
      border-radius: 50%; background: ${color};
      border: 3px solid ${ring}; box-shadow: ${shadow};
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: ${onColor}; font-size: 12px; font-weight: 700; white-space: nowrap;
    ">${shortName}</div>
  `
}

/** 商户名截断为足迹短标（最多 2 字） */
export function merchantShortLabel(name: string, max = 2): string {
  const n = String(name || '')
  return n.length > max ? n.slice(0, max) : n
}
