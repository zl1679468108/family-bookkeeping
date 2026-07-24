/**
 * 月份区间工具 — 与 PC frontend/src/utils/month.ts API 对齐
 */
import { formatDateYMD } from "./date";

export function monthDateRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: formatDateYMD(start), end: formatDateYMD(end) };
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

/**
 * 月份展示：2024 年 07 月
 * 接受 Date / YYYY-MM / YYYY-MM-DD / YYYY-MM-01
 */
export function formatMonthDisplay(input: string | Date): string {
  const { year, month } = resolveYearMonth(input);
  if (!year || !month) {
    return typeof input === "string" ? input : "";
  }
  return `${year} 年 ${String(month).padStart(2, "0")} 月`;
}

/**
 * 紧凑月份：2024年7月（图表轴等）
 */
export function formatMonthDisplayCompact(input: string | Date): string {
  const { year, month } = resolveYearMonth(input);
  if (!year || !month) {
    return typeof input === "string" ? input : "";
  }
  return `${year}年${month}月`;
}

function resolveYearMonth(input: string | Date): { year: number; month: number } {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return { year: 0, month: 0 };
    return { year: input.getFullYear(), month: input.getMonth() + 1 };
  }
  const s = String(input || "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return { year: 0, month: 0 };
}
