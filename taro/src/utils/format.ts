/**
 * 通用格式化工具
 */

/** 金额简写（≥1万显示为 X.X万） */
export function fmtAmount(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 10000)
    return (abs / 10000).toFixed(abs % 10000 === 0 ? 0 : 1) + "万";
  return abs.toLocaleString("zh-CN");
}

/** 日期格式化 YYYY-MM-DD */
export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 友好日期（今天/昨天/月日） */
export function fmtFriendlyDate(ds: string): string {
  const d = new Date(ds);
  const t = new Date();
  const y = new Date(t);
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return "今天";
  if (d.toDateString() === y.toDateString()) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
