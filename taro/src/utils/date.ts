/**
 * 日期工具 — 与 PC frontend/src/utils/date.ts API 对齐
 */
export function parseDateInput(input: string | Date): Date {
  if (input instanceof Date) return input;
  const normalized = input.includes("T") ? input : input.replace(" ", "T");
  return new Date(normalized);
}

export function formatDateYMD(input: string | Date): string {
  const date = parseDateInput(input);
  if (Number.isNaN(date.getTime())) {
    return typeof input === "string" ? input : "";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatFriendlyDate(input: string | Date): string {
  const date = parseDateInput(input);
  if (Number.isNaN(date.getTime())) {
    return typeof input === "string" ? input : "";
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (day.getTime() === today.getTime()) return "今天";
  if (day.getTime() === yesterday.getTime()) return "昨天";
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return formatDateYMD(date);
}

export function todayBeijing(): string {
  const now = new Date();
  const beijing = new Date(
    now.getTime() + now.getTimezoneOffset() * 60000 + 8 * 3600000,
  );
  return formatDateYMD(beijing);
}

export function formatDate(dateStr: string, mode: "full" | "dashboard" = "full"): string {
  if (mode === "dashboard") return formatFriendlyDate(dateStr);
  return formatDateYMD(dateStr);
}

/** 兼容旧名 */
export const fmtDate = (d: Date): string => formatDateYMD(d);
export const fmtFriendlyDate = (ds: string): string => formatFriendlyDate(ds);

/** 日期时间展示（本地/浏览器；用于模板详情等非业务流水时间） */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("zh-CN");
}

/** 精确到分钟：YYYY-MM-DD HH:mm（详情弹窗创建/更新时间） */
export function formatDateTimeMinute(input: string | Date | null | undefined): string {
  if (!input) return "-";
  if (typeof input === "string") {
    const m = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (m) return `${m[1]} ${m[2]}`;
  }
  const d = input instanceof Date ? input : parseDateInput(String(input));
  if (Number.isNaN(d.getTime())) return String(input);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}`;
}
