/**
 * 购物平台图标 — 纯数据与 data URL 见 shared-utils；保持 Taro 旧 API。
 */

export {
  SHOPPING_PLATFORM_ICONS,
  PLATFORM_SVG_MAP,
  getPlatformIconSpecByKey,
  isPlatformIcon,
  buildPlatformIconSvgString,
  getPlatformIconSvgDataUrl,
  isIconUrl,
} from "../../../shared-utils/src/platformIcons";
export type {
  PlatformIconItem,
  PlatformSvgSpec,
} from "../../../shared-utils/src/platformIcons";

import { getPlatformIconSvgDataUrl } from "../../../shared-utils/src/platformIcons";

/** 兼容：返回 data URL */
export const getPlatformIconByKey = (key: string): string =>
  getPlatformIconSvgDataUrl(key);

/**
 * 历史 API：renderPlatformIconSvg(key, size?, color?)
 * size 仅占位，显示尺寸由外层 Image style 控制
 */
export const renderPlatformIconSvg = (
  key: string,
  _size: number = 20,
  color: string = "#1a1c19",
): string => getPlatformIconSvgDataUrl(key, color);
