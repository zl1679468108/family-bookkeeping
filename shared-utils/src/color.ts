/**
 * 颜色解析与混合 — 地图商户足迹等纯函数
 */

export function parseHexRgb(hex: string): [number, number, number] {
  const h = String(hex || '').replace('#', '').trim()
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  if (h.length >= 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  return [170, 170, 170]
}

/** t=0 → a，t=1 → b */
export function blendHexColors(a: string, b: string, t: number): string {
  const ratio = Math.min(1, Math.max(0, t))
  const [ar, ag, ab] = parseHexRgb(a)
  const [br, bg, bb] = parseHexRgb(b)
  const r = Math.round(ar + (br - ar) * ratio)
  const g = Math.round(ag + (bg - ag) * ratio)
  const bl = Math.round(ab + (bb - ab) * ratio)
  return `rgb(${r},${g},${bl})`
}

/**
 * 商户收支占比色：支出主导 → exp，收入主导 → inc，中间线性混合
 */
export function merchantBalanceColor(
  expenseTotal: number,
  incomeTotal: number,
  colors: { exp: string; inc: string; muted: string },
): string {
  const total = Number(expenseTotal || 0) + Number(incomeTotal || 0)
  if (total === 0) return colors.muted
  const expenseRatio = Number(expenseTotal || 0) / total
  if (expenseRatio >= 0.9) return colors.exp
  if (expenseRatio <= 0.1) return colors.inc
  // 越偏收入越靠近 inc
  return blendHexColors(colors.exp, colors.inc, 1 - expenseRatio)
}
