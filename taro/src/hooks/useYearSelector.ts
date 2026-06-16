/**
 * useYearSelector — 年报年份选择器
 * 基于本地存储记住用户上次选择的年份
 */
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";

const STORAGE_KEY = "selected_report_year";

export function useYearSelector() {
  const currentYear = new Date().getFullYear();

  const [year, setYearState] = useState<number>(() => {
    try {
      const saved = Taro.getStorageSync(STORAGE_KEY);
      if (saved && typeof saved === "number") return saved;
    } catch {
      // ignore
    }
    return currentYear;
  });

  const setYear = (y: number) => {
    setYearState(y);
    try {
      Taro.setStorageSync(STORAGE_KEY, y);
    } catch {
      // ignore
    }
  };

  return {
    year,
    setYear,
    currentYear,
    years: Array.from({ length: 5 }, (_, i) => currentYear - i),
  };
}
