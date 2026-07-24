/**
 * 图片缩放尺寸计算 — 压缩前纯函数（端侧再落到 canvas / 原生压缩）
 */

export type ImageSize = { width: number; height: number }

/** 宽度超过 maxWidth 时等比缩小 */
export function fitWithinMaxWidth(
  width: number,
  height: number,
  maxWidth: number,
): ImageSize {
  const w = Number(width) || 0
  const h = Number(height) || 0
  const maxW = Math.max(1, Number(maxWidth) || 1)
  if (w <= maxW || w <= 0) {
    return { width: w, height: h }
  }
  return {
    width: maxW,
    height: (h / w) * maxW,
  }
}

/** 最长边不超过 maxSide */
export function fitWithinMaxSide(
  width: number,
  height: number,
  maxSide: number,
): ImageSize {
  const w = Number(width) || 0
  const h = Number(height) || 0
  const maxS = Math.max(1, Number(maxSide) || 1)
  const long = Math.max(w, h)
  if (long <= maxS || long <= 0) {
    return { width: w, height: h }
  }
  const scale = maxS / long
  return { width: w * scale, height: h * scale }
}
