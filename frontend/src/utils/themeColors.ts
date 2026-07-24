/**
 * 读取设计令牌（支持暗色主题）—— 供 ECharts / canvas / 地图 marker 等需要真实 hex 的场景。
 */
export function getCssVar(name: string, fallback = ""): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** 图表 / canvas 语义色（随 data-theme 变化） */
export function getThemeColors() {
  return {
    pr: getCssVar("--pr", "#2D9D8A"),
    prH: getCssVar("--prH", "#248B78"),
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

/** 多系列调色板（主色 + 语义色衍生，暗色下仍清晰） */
export function getChartPalette(): string[] {
  const c = getThemeColors();
  return [c.pr, c.exp, c.inc, c.warn, c.info, "#8B5CF6", "#EC4899", "#F97316", "#06B6D4", "#84CC16"];
}
