/**
 * 全局统一空状态插画 SVG data URL
 * SVG 与重着色见 shared-utils；本文件注入 PC 主题色
 */
import type { ThemeColors } from '../../../utils/themeColors'
import { getThemeColors } from '../../../utils/themeColors'
import {
  emptyIllustrationDataUrl,
  type EmptyIllustrationTheme,
} from '../../../utils/emptyIllustration'

export function getEmptyIllustrationDataUrl(theme: ThemeColors = getThemeColors()): string {
  const map: EmptyIllustrationTheme = {
    pr: theme.pr,
    prBg: theme.prBg,
    fg: theme.fg,
    fg2: theme.fg2,
    bd: theme.bd,
    bdL: theme.bdL,
    srf: theme.srf,
  }
  return emptyIllustrationDataUrl(map)
}
