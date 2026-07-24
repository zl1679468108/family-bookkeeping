export { fmtAmount } from "./budget";

// 日期 — 与 PC 对齐，旧名保留为别名
export {
  formatDate,
  formatDateYMD,
  formatFriendlyDate,
  todayBeijing,
  parseDateInput,
  fmtDate,
  fmtFriendlyDate,
} from "./date";

// 预算语义
export {
  getBudgetVariant,
  isBudgetOver,
  formatMoney,
  sortBudgetCategoriesByRisk,
  BUDGET_WARN_AT,
  BUDGET_OVER_AT,
  budgetStatusToVariant,
  budgetVariantLabel,
} from "./budget";
export type { BudgetVariant, BudgetCategoryLike } from "./budget";

export { getErrorMessage } from "./errorMessage";

export { monthDateRange, toMonthKey, parseMonthKey, formatMonthDisplay, formatMonthDisplayCompact } from "./month";

// 轻提示 — 详见 ./toast
export { toast, toastSuccess, toastInfo, toastWarn, toastError } from "./toast";
export type { ToastType } from "./toast";
