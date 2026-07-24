/**
 * useMonthSelector — 统一月份选择状态
 *
 * 返回 year/month 状态、dateRange、monthKey 等。
 * 在 Home/Transactions/Budgets 等页面使用。
 */
import { useState, useMemo } from "react";
import { monthDateRange, toMonthKey } from "../utils/month";

interface UseMonthSelectorOptions {
  /** 初始月份（默认当前月） */
  initialYear?: number;
  initialMonth?: number;
}

export function useMonthSelector(options: UseMonthSelectorOptions = {}) {
  const now = new Date();
  const [year, setYear] = useState(options.initialYear ?? now.getFullYear());
  const [month, setMonth] = useState(
    options.initialMonth ?? now.getMonth() + 1,
  );

  const dateRange = useMemo(() => monthDateRange(year, month), [year, month]);

  const monthKey = useMemo(() => toMonthKey(year, month), [year, month]);

  return {
    year,
    month,
    setYear,
    setMonth,
    dateRange,
    monthKey,
    /** 同时设置年月 */
    setYearMonth: (y: number, m: number) => {
      setYear(y);
      setMonth(m);
    },
  };
}
