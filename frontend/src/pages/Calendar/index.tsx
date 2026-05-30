import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDailySummary } from '../../services/statisticsApi';
import { getTransactions, type Transaction } from '../../services/api';
import { useCategoryLookup } from '../../hooks/useCategories';
import { formatAmountWithType, formatDate } from '../../utils/common';
import type { DailySummaryItem } from '../../types/statistics';
import './index.scss';

/** 获取某年某月的天数 */
const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

/** 获取某年某月第一天是星期几（0=周日, 6=周六） */
const firstDayOfWeek = (year: number, month: number): number =>
  new Date(year, month - 1, 1).getDay();

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

/** 构建当月月份字符串 "YYYY-MM" */
const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`;

/** 格式化金额为紧凑展示（完整数值，不加货币符号） */
const formatCompactAmount = (amount: number): string => {
  if (amount === 0) return '';
  const abs = Math.abs(amount);
  return abs.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const Calendar: React.FC = () => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthKey = toMonthKey(viewYear, viewMonth);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // ---- 每日汇总数据 ----
  const { data: dailyData = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['statistics', 'daily-summary', monthKey],
    queryFn: () => fetchDailySummary({ month: monthKey }),
    staleTime: 2 * 60 * 1000,
    refetchOnMount: false,
  });

  // ---- 选中日期的交易明细 ----
  const { data: dayTransactions = [], isLoading: txsLoading } = useQuery({
    queryKey: ['transactions', 'by-date', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [] as Transaction[];
      const result = await getTransactions({
        startDate: selectedDate,
        endDate: selectedDate,
        pageSize: 200,
      });
      return result.data;
    },
    enabled: !!selectedDate,
  });

  // ---- 日历网格构建 ----
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfWeek(viewYear, viewMonth);

  // 按日期快速索引
  const dateMap = useMemo(() => {
    const map: Record<string, DailySummaryItem> = {};
    for (const item of dailyData) {
      map[item.date] = item;
    }
    return map;
  }, [dailyData]);

  // 构建日历格子数组
  const cells = useMemo(() => {
    const result: (DailySummaryItem | null)[] = [];
    // 填充前置空白
    for (let i = 0; i < startDow; i++) {
      result.push(null);
    }
    // 填充日期
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push(
        dateMap[dateStr] || {
          date: dateStr,
          total_income: 0,
          total_expense: 0,
          transaction_count: 0,
        },
      );
    }
    return result;
  }, [startDow, totalDays, viewYear, viewMonth, dateMap]);

  // ---- 月度统计 ----
  const monthStats = useMemo(() => {
    if (dailyData.length === 0) {
      return {
        avgExpense: 0,
        maxExpenseDay: null as DailySummaryItem | null,
        minExpenseDay: null as DailySummaryItem | null,
        expenseDaysRatio: 0,
      };
    }

    // 只统计有支出的天
    const daysWithExpense = dailyData.filter((d) => d.total_expense > 0);
    const totalExpense = daysWithExpense.reduce((sum, d) => sum + d.total_expense, 0);

    // 日均支出 = 总支出 / 当月天数
    const avgExpense = totalDays > 0 ? totalExpense / totalDays : 0;

    // 最高消费日
    let maxExpenseDay: DailySummaryItem | null = null;
    // 最低消费日（仅在有支出的天中比较）
    let minExpenseDay: DailySummaryItem | null = null;

    for (const d of daysWithExpense) {
      if (!maxExpenseDay || d.total_expense > maxExpenseDay.total_expense) {
        maxExpenseDay = d;
      }
      if (!minExpenseDay || d.total_expense < minExpenseDay.total_expense) {
        minExpenseDay = d;
      }
    }

    // 支出天数占比
    const expenseDaysRatio = totalDays > 0 ? (daysWithExpense.length / totalDays) * 100 : 0;

    return { avgExpense, maxExpenseDay, minExpenseDay, expenseDaysRatio };
  }, [dailyData, totalDays]);

  // ---- 导航 ----
  const goPrevMonth = useCallback(() => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [viewMonth]);

  const goNextMonth = useCallback(() => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [viewMonth]);

  const goToday = useCallback(() => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    setSelectedDate(null);
  }, [now]);

  // ---- 点击日期 ----
  const handleDateClick = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, []);

  // ---- 渲染 ----
  return (
    <div className="calendar-page">
      {/* 顶部标题与月份切换 */}
      <div className="calendar-header">
        <h2 className="calendar-title">现金流日历</h2>
        <div className="calendar-nav">
          <button className="btn btn-secondary" onClick={goPrevMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="calendar-month-label">
            {viewYear}年{viewMonth}月
          </span>
          <button className="btn btn-secondary" onClick={goNextMonth}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className="btn btn-secondary calendar-today-btn" onClick={goToday}>
            今天
          </button>
        </div>
      </div>

      {/* 日历网格 */}
      <div className="calendar-grid-wrapper">
        {summaryLoading ? (
          <div className="calendar-loading">加载中…</div>
        ) : (
          <div className="calendar-grid">
            {/* 星期标题行 */}
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}

            {/* 日期格子 */}
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="calendar-cell calendar-cell--empty" />;
              }

              const dayNum = parseInt(cell.date.slice(8, 10), 10);
              const isToday = cell.date === todayStr;
              const isSelected = cell.date === selectedDate;
              const hasTransactions = cell.transaction_count > 0;

              return (
                <div
                  key={cell.date}
                  className={`calendar-cell ${isToday ? 'calendar-cell--today' : ''} ${isSelected ? 'calendar-cell--selected' : ''} ${hasTransactions ? 'calendar-cell--has-data' : ''}`}
                  onClick={() => handleDateClick(cell.date)}
                >
                  <span className="calendar-cell-day">{dayNum}</span>
                  {cell.total_expense > 0 && (
                    <span className="calendar-cell-amount calendar-cell-amount--expense">
                      -{formatCompactAmount(cell.total_expense)}
                    </span>
                  )}
                  {cell.total_income > 0 && (
                    <span className="calendar-cell-amount calendar-cell-amount--income">
                      +{formatCompactAmount(cell.total_income)}
                    </span>
                  )}
                  {cell.transaction_count > 0 && (
                    <span className="calendar-cell-count">{cell.transaction_count}笔</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 月度汇总卡片 */}
      <div className="calendar-summary">
        <div className="summary-card">
          <div className="summary-card-label">本月日均支出</div>
          <div className="summary-card-value">
            ¥ {monthStats.avgExpense.toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">最高消费日</div>
          <div className="summary-card-value summary-card-value--danger">
            {monthStats.maxExpenseDay
              ? `${monthStats.maxExpenseDay.date.slice(8, 10)}日 ¥${monthStats.maxExpenseDay.total_expense.toFixed(2)}`
              : '暂无'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">最低消费日</div>
          <div className="summary-card-value summary-card-value--success">
            {monthStats.minExpenseDay
              ? `${monthStats.minExpenseDay.date.slice(8, 10)}日 ¥${monthStats.minExpenseDay.total_expense.toFixed(2)}`
              : '暂无'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">支出天数占比</div>
          <div className="summary-card-value">
            {monthStats.expenseDaysRatio.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* 选中日期的交易明细 */}
      {selectedDate && (
        <div className="calendar-day-detail">
          <div className="day-detail-header">
            <h3>{selectedDate} 交易明细</h3>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedDate(null)}
            >
              收起
            </button>
          </div>
          {txsLoading ? (
            <div className="calendar-loading">加载中…</div>
          ) : dayTransactions.length === 0 ? (
            <div className="calendar-empty">当天暂无交易记录</div>
          ) : (
            <div className="transactions-list">
              {dayTransactions.map((item) => {
                const isIncome = item.type === 'income';
                const categoryName = getCategoryName(item.category);
                const icon = getCategoryIcon(item.category);
                const name = item.description || categoryName;
                const metaParts = [formatDate(item.date, 'full'), categoryName];
                if ((item as any).location_name) {
                  metaParts.push((item as any).location_name);
                }
                const meta = metaParts.join(' · ');
                const amount = formatAmountWithType(parseFloat(String(item.amount)), isIncome);

                return (
                  <div key={item.id} className="transaction-item">
                    <div className="transaction-icon">{icon}</div>
                    <div className="transaction-info">
                      <div className="transaction-name">{name}</div>
                      <div className="transaction-meta">{meta}</div>
                    </div>
                    <div className={`transaction-amount ${isIncome ? 'income' : 'expense'}`}>
                      {amount}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
