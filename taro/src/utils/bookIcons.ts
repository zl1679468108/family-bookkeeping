import { THEME_TOKEN_HEX } from "./themeTokens";
/**
 * 账本图标 — 纯数据与 SVG data URL 见 shared-utils；本文件保持 Taro 旧 API 别名。
 */

export {
  BOOK_ICONS,
  BOOK_ICON_SVG_MAP,
  getBookIconSpecByKey,
  getBookEmojiByKey,
  getBookEmoji,
  getBookEmojiByIconOrId,
  isCustomIconUrl,
  isBookIconKey,
  buildBookIconSvgString,
  getBookIconSvgDataUrl,
} from "../../../shared-utils/src/bookIcons";
export type {
  BookIconItem,
  BookIconSvgSpec,
} from "../../../shared-utils/src/bookIcons";

import { getBookIconSvgDataUrl } from "../../../shared-utils/src/bookIcons";

/** 兼容旧名：返回 Image src URL */
export const getBookIconByKey = (iconKey?: string): string =>
  getBookIconSvgDataUrl(iconKey);

/**
 * 与历史 API 兼容：renderBookIconSvg(key, size?, color?)
 * size 仅占位（SVG 内建 viewBox 尺寸），由外层 Image style 控制显示大小
 */
export const renderBookIconSvg = (
  iconKey?: string,
  _size: number = 20,
  color: string = THEME_TOKEN_HEX.light.fg,
): string => getBookIconSvgDataUrl(iconKey, color);
