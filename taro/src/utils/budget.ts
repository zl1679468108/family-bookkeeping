/**
 * 预算相关纯函数 — 与 PC frontend/src/utils/budget.ts API 对齐
 */
export type BudgetVariant = "safe" | "warn" | "danger";

export const BUDGET_WARN_AT = 80;
export const BUDGET_OVER_AT = 100;

export function getBudgetVariant(progress: number): BudgetVariant {
  if (progress >= BUDGET_OVER_AT) return "danger";
  if (progress >= BUDGET_WARN_AT) return "warn";
  return "safe";
}

export function isBudgetOver(progress: number): boolean {
  return progress >= BUDGET_OVER_AT;
}

/**
 * 金额展示（与 PC formatMoney API 对齐）
 * - compact 默认 true（小程序卡片更紧凑）
 * - wan: ≥1 万显示 X.X万
 */
export function formatMoney(
  amount: number | string,
  options: { compact?: boolean; wan?: boolean; showSign?: boolean; sign?: "+" | "-" } = {},
): string {
  const { compact = true, wan = false, showSign = false, sign = "+" } = options;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) {
    return compact || wan ? "¥0" : "¥ 0.00";
  }
  const abs = Math.abs(num);
  let body: string;
  if (wan && abs >= 10000) {
    const wanVal = abs / 10000;
    const wanText = wanVal.toFixed(abs % 10000 === 0 ? 0 : 1);
    body = `¥${wanText}万`;
  } else {
    const formatted = abs.toLocaleString("zh-CN", {
      minimumFractionDigits: compact || wan ? 0 : 2,
      maximumFractionDigits: 2,
    });
    body = compact || wan ? `¥${formatted}` : `¥ ${formatted}`;
  }
  if (showSign) return `${sign}${body}`;
  if (num < 0) return `-${body}`;
  return body;
}


export interface BudgetCategoryLike {
  budget: number;
  progress: number;
}

export function sortBudgetCategoriesByRisk<T extends BudgetCategoryLike>(
  categories: T[],
  limit?: number,
): T[] {
  const sorted = [...categories]
    .filter((cat) => cat.budget > 0)
    .sort((a, b) => {
      const aOver = isBudgetOver(a.progress) ? 1 : 0;
      const bOver = isBudgetOver(b.progress) ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      return b.progress - a.progress;
    });
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

/** 后端预算 status 字段 → UI 变体（over/warning/ok|normal） */
export function budgetStatusToVariant(status?: string | null): BudgetVariant {
  if (status === 'over') return 'danger'
  if (status === 'warning' || status === 'warn') return 'warn'
  return 'safe'
}

/** 变体中文标签 */
export function budgetVariantLabel(variant: BudgetVariant): string {
  if (variant === 'danger') return '超预算'
  if (variant === 'warn') return '接近预算'
  return '正常'
}

/** 清理金额输入：仅保留数字与一个小数点，默认最多 2 位小数 */
export function sanitizeAmountInput(raw: string, maxDecimals = 2): string {
  const v = String(raw ?? "").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length === 1) return parts[0];
  return parts[0] + "." + (parts[1] || "").slice(0, maxDecimals);
}

/** 是否为有效正数金额 */
export function isValidPositiveAmount(
  amount: string | number | null | undefined,
): boolean {
  if (amount === null || amount === undefined || amount === "") return false;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return Number.isFinite(num) && num > 0;
}

/** 解析金额为 number，非法时返回 0 */
export function parseAmount(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined || amount === "") return 0;
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return Number.isFinite(num) ? num : 0;
}

