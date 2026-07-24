/**
 * emptyIcons — 全局统一空状态插画（shared-utils emptyIllustration）
 * 小程序暂用默认浅色稿；后续可按主题 token 注入 recolor
 */
import { emptyIllustrationDataUrl } from "./emptyIllustration";

/** 获取空状态插画 data:image/svg+xml URL */
export const getEmptyIconDataUrl = (): string => emptyIllustrationDataUrl();
