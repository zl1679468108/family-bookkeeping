/**
 * 分类背景色 — 共享 tone 逻辑，保留 getCategoryBg 旧名
 */
export {
  getCategoryBgTone,
  getCategoryBgClass,
  getCategoryBgCssVar,
} from "../../../shared-utils/src/categoryColors";
export type { CategoryBgTone } from "../../../shared-utils/src/categoryColors";

import { getCategoryBgClass } from "../../../shared-utils/src/categoryColors";

/** @deprecated 使用 getCategoryBgClass；保留旧名兼容 */
export function getCategoryBg(name: string): string {
  return getCategoryBgClass(name);
}
