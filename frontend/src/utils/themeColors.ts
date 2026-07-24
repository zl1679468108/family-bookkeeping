/**
 * 读取设计令牌（支持暗色主题）—— 供 ECharts / canvas / 地图 marker 等需要真实 hex 的场景。
 */
export function getCssVar(name: string, fallback = ""): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export type ThemeColors = ReturnType<typeof getThemeColors>;

/** 图表 / canvas 语义色（随 data-theme 变化） */
export function getThemeColors() {
  return {
    pr: getCssVar("--pr", "#2D9D8A"),
    prH: getCssVar("--prH", "#248B78"),
    onPr: getCssVar("--on-pr", "#ffffff"),
    inc: getCssVar("--inc", "#3BA272"),
    exp: getCssVar("--exp", "#E06055"),
    warn: getCssVar("--warn", "#E8A838"),
    info: getCssVar("--info", "#4A90D9"),
    fg: getCssVar("--fg", "#1A1C19"),
    fg2: getCssVar("--fg2", "#5A5D58"),
    fg3: getCssVar("--fg3", "#8B8E89"),
    bd: getCssVar("--bd", "#E0E2DD"),
    bdL: getCssVar("--bdL", "#EDEEE9"),
    srf: getCssVar("--srf", "#FFFFFF"),
    bg: getCssVar("--bg", "#F6F7F4"),
    srfH: getCssVar("--srfH", "#F9FAF8"),
    expBg: getCssVar("--expBg", "#FCEEED"),
    incBg: getCssVar("--incBg", "#EAF7F0"),
    prBg: getCssVar("--prBg", "#E7F5F2"),
    warnBg: getCssVar("--warnBg", "#FDF6E8"),
    infoBg: getCssVar("--infoBg", "#ECF3FB"),
  };
}

/** 多系列调色板（主色 + 语义色衍生；扩展色随暗色略提亮以保证对比） */
export function getChartPalette(): string[] {
  const c = getThemeColors();
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark";
  // 扩展色：非语义系列，暗色用更亮一档避免沉底
  const extras = isDark
    ? ["#A78BFA", "#F472B6", "#FB923C", "#22D3EE", "#A3E635"]
    : ["#8B5CF6", "#EC4899", "#F97316", "#06B6D4", "#84CC16"];
  return [c.pr, c.exp, c.inc, c.warn, c.info, ...extras];
}

/**
 * ECharts canvas 不解析 CSS var，统一用计算后的 hex。
 * 供坐标轴 / 图例 / 提示 / 分割线等 chrome 样式复用。
 */
export function getEchartsChrome(theme: ThemeColors = getThemeColors()) {
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
    splitLine: { lineStyle: { color: theme.bdL, type: "dashed" as const } },
    pieBorder: theme.srf,
  };
}
