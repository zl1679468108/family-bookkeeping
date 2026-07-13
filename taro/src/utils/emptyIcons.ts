/**
 * emptyIcons — 空状态默认图标（与 bookIcons / platformIcons 同模式的 SVG data URL）
 *
 * 全模块共用同一个「空盒子」线性图标，颜色取中性灰，在浅色 / 深色背景下均清晰。
 * 标题由各模块通过 EmptyState 的 title 自定，图标保持统一。
 */

const EMPTY_BOX_PATHS = [
  // 托盘主体
  "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
  // 托盘内折线
  "M22 12h-6l-2 3h-4l-2-3H2",
];

const buildEmptyBoxSvg = (color: string, strokeWidth: number): string => {
  const common = `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;
  const children = EMPTY_BOX_PATHS.map((d) => `<path ${common} d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">${children}</svg>`;
};

const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/**
 * 获取空状态图标 data:image/svg+xml URL（默认中性灰，自动适配深浅色背景）
 */
export const getEmptyIconDataUrl = (
  color: string = "#A6A9A4",
  strokeWidth: number = 1.5,
): string => svgToDataUrl(buildEmptyBoxSvg(color, strokeWidth));
