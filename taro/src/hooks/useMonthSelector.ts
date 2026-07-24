/**
 * useMonthSelector — 统一月份选择状态
 *
 * 返回 year/month 状态、dateRange、monthKey 等。
 * 纯计算见 shared-utils/monthState；端侧仅保留 useState。
 */
import { useState, useMemo } from "react";
import {
  resolveYearMonth,
  yearMonthDateRange,
  yearMonthKey,
} from "../utils/monthState";

interface UseMonthSelectorOptions {
  /** 初始月份（默认当前月） */
  initialYear?: number;
  initialMonth?: number;
}

export function useMonthSelector(options: UseMonthSelectorOptions = {}) {
  const initial = resolveYearMonth({
    initialYear: options.initialYear,
    initialMonth: options.initialMonth,
  });
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const dateRange = useMemo(() => yearMonthDateRange(year, month), [year, month]);
  const monthKey = useMemo(() => yearMonthKey(year, month), [year, month]);

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
