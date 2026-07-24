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
