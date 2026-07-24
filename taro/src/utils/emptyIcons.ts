/**
 * emptyIcons — 全局统一空状态插画（shared-utils emptyIllustration）
 * 按主题 token 重着色，对齐 PC EmptyState
 */
import {
  emptyIllustrationDataUrl,
  emptyIllustrationThemeFromMode,
} from "./emptyIllustration";

/** 获取空状态插画 data URL；isDark 时按暗色令牌重着色 */
export const getEmptyIconDataUrl = (isDark = false): string =>
  emptyIllustrationDataUrl(emptyIllustrationThemeFromMode(isDark));
