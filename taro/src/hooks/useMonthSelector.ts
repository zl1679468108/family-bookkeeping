/**
 * useMonthSelector — 统一月份选择状态
 *
 * 返回 year/month 状态、dateRange、monthKey 等。
 * 在 Home/Transactions/Statistics/Budgets/Calendar 五个页面使用。
 */
import { useState, useMemo } from "react";

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

  const dateRange = useMemo(() => {
    const sm = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();
    return {
      start: `${year}-${sm}-01`,
      end: `${year}-${sm}-${String(lastDay).padStart(2, "0")}`,
    };
  }, [year, month]);

  const monthKey = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}-01`,
    [year, month],
  );

  return {
    year,
    month,
    setYear,
    setMonth,
    /** { start: '2026-06-01', end: '2026-06-30' } */
    dateRange,
    /** '2026-06-01' */
    monthKey,
  };
}
