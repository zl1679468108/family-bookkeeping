/** 收支类型文案与选项 —— 列表/详情/表单共用 */

export type TransactionTypeCode = "expense" | "income";

export function transactionTypeLabel(
  type?: string | null,
  fallback = "",
): string {
  if (type === "income") return "收入";
  if (type === "expense") return "支出";
  return fallback || (type ?? "");
}

export function isExpenseType(type?: string | null): boolean {
  return type === "expense";
}

export function isIncomeType(type?: string | null): boolean {
  return type === "income";
}

/** Picker / 选项 */
export const TRANSACTION_TYPE_OPTIONS: ReadonlyArray<{
  key: TransactionTypeCode;
  label: string;
}> = [
  { key: "expense", label: "支出" },
  { key: "income", label: "收入" },
];

/** 流水筛选：全部 + 支出 + 收入 */
export const FILTER_ALL_TYPES = "全部类型";
export const FILTER_ALL_CATEGORIES = "全部分类";
export const FILTER_ALL_TIME = "全部时间";
export const FILTER_LAST_7_DAYS = "近 7 天";
export const FILTER_LAST_30_DAYS = "近 30 天";

export const TRANSACTION_TYPE_FILTER_LABELS = [FILTER_ALL_TYPES, "支出", "收入"] as const;

export const TRANSACTION_TIME_FILTER_LABELS = [
  FILTER_ALL_TIME,
  FILTER_LAST_7_DAYS,
  FILTER_LAST_30_DAYS,
] as const;

/** Admin / 列表 status 徽标 class */
export function transactionTypeStatusClass(type?: string | null): string {
  return type === "income" ? "status status--success" : "status status--danger";
}

/** 金额着色 class */
export function transactionTypeAmountClass(type?: string | null): string {
  return type === "income" ? "amount amount--income" : "amount amount--expense";
}

/** 短标签：收 / 支（地图气泡等窄位） */
export function transactionTypeShortLabel(type?: string | null): string {
  if (type === "income") return "收";
  if (type === "expense") return "支";
  return "";
}

/** Tab：支出分类 / 收入分类 */
export function categoryTypeTabLabel(type?: string | null): string {
  if (type === "income") return "收入分类";
  return "支出分类";
}
