/**
 * 图表主题纯数据 — ECharts / 其它 canvas 图表共用
 * 端侧负责读取 CSS 变量得到语义色 hex 后传入
 */

export type ChartSemanticColors = {
  pr: string
  exp: string
  inc: string
  warn: string
  info: string
  fg: string
  fg3: string
  bd: string
  bdL: string
  srf: string
  srfH: string
  bg: string
}

/** 非语义扩展色：暗色用更亮一档避免沉底 */
export const CHART_EXTRA_COLORS = {
  light: ['#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16'],
  dark: ['#A78BFA', '#F472B6', '#FB923C', '#22D3EE', '#A3E635'],
} as const

/** 主色 + 语义色 + 扩展色 */
export function buildChartPalette(
  semantic: Pick<ChartSemanticColors, 'pr' | 'exp' | 'inc' | 'warn' | 'info'>,
  isDark: boolean,
): string[] {
  const extras = isDark ? CHART_EXTRA_COLORS.dark : CHART_EXTRA_COLORS.light
  return [semantic.pr, semantic.exp, semantic.inc, semantic.warn, semantic.info, ...extras]
}

/** ECharts chrome（坐标轴 / 图例 / 提示 / 分割线） */
export function buildEchartsChrome(theme: ChartSemanticColors) {
  return {
    text: theme.fg,
    muted: theme.fg3,
    border: theme.bd,
    surface: theme.srf,
    surfaceHover: theme.srfH,
    bg: theme.bg,
    tooltip: {
      backgroundColor: theme.srfH,
      borderColor: theme.bd,
      textStyle: { color: theme.fg },
    },
    legendText: { color: theme.fg, fontSize: 12 },
    axisLabel: { color: theme.fg3 },
    axisLine: { lineStyle: { color: theme.bd } },
    splitLine: { lineStyle: { color: theme.bdL, type: 'dashed' as const } },
    pieBorder: theme.srf,
  }
}
