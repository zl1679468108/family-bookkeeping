/**
 * 设计令牌静态 hex — SVG data URL / 原生导航栏 / canvas 等无法读 CSS var 的场景
 * 与 frontend design-tokens.css 亮/暗值保持同步
 */

export const THEME_TOKEN_HEX = {
  light: {
    pr: '#2D9D8A',
    prH: '#248B78',
    fg: '#1A1C19',
    fg2: '#5A5D58',
    fg3: '#8B8E89',
    bg: '#F6F7F4',
    srf: '#FFFFFF',
    onPr: '#FFFFFF',
    inc: '#3BA272',
    exp: '#E06055',
    warn: '#E8A838',
    info: '#4A90D9',
  },
  dark: {
    pr: '#45B7A7',
    prH: '#52C4B4',
    fg: '#E8EAE5',
    fg2: '#A5A8A3',
    fg3: '#6E716C',
    bg: '#1A1C19',
    srf: '#252825',
    onPr: '#FFFFFF',
    inc: '#52C494',
    exp: '#F08075',
    warn: '#F0C040',
    info: '#60A5FA',
  },
} as const

export type ThemeModeHex = keyof typeof THEME_TOKEN_HEX
export type ThemeTokenHex = (typeof THEME_TOKEN_HEX)[ThemeModeHex]

export function getThemeTokenHex(isDark: boolean): ThemeTokenHex {
  return isDark ? THEME_TOKEN_HEX.dark : THEME_TOKEN_HEX.light
}
