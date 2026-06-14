import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDailySummary } from '../../services/statisticsApi';
import { getTransactions, type Transaction } from '../../services/api';
import { useCategoryLookup } from '../../hooks/useCategories';
import { formatAmountWithType } from '../../utils/common';
import type { DailySummaryItem } from '../../types/statistics';
import { Skeleton } from '../../components/ui/Skeleton';

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

/** 格式化金额（不加货币符号） */
const formatAmount = (amount: number): string => {
  if (amount === 0) return '';
  return amount.toLocaleString('zh-CN', {
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
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  // ---- 月度统计 ----
  const monthStats = useMemo(() => {
    const totalExpense = dailyData.reduce((sum, d) => sum + d.total_expense, 0);
    const totalIncome = dailyData.reduce((sum, d) => sum + d.total_income, 0);
    const totalCount = dailyData.reduce((sum, d) => sum + d.transaction_count, 0);
    return { totalExpense, totalIncome, totalCount };
  }, [dailyData]);

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

  // ---- 点击日期 ----
  const handleDateClick = useCallback((dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }, []);

  // ---- 点击年月 ----
  const handleHeaderClick = useCallback(() => {
    setShowPicker((prev) => !prev);
  }, []);

  // ---- 年月选择器 ----
  const handleYearChange = useCallback((year: number) => {
    setViewYear(year);
    setShowPicker(false);
    setSelectedDate(null);
  }, []);

  const handleMonthChange = useCallback((month: number) => {
    setViewMonth(month);
    setShowPicker(false);
    setSelectedDate(null);
  }, []);

  // ---- 点击外部关闭选择器 ----
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.cal-header-row')) {
          setShowPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- 年份选项 ----
  const yearOptions = [2022, 2023, 2024, 2025, 2026, 2027];

  // ---- 渲染 ----
  return (
    <div className="page-container">
      <div className="dash-card">
        {/* 顶部标题与月份切换 */}
        <div className="cal-header-row" onClick={handleHeaderClick}>
          <h3>{viewYear}年{viewMonth}月 ▼</h3>
          <button className="cal-nav-btn cal-nav-btn--prev" onClick={(e) => { e.stopPropagation(); goPrevMonth(); }} title="上一月">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button className="cal-nav-btn cal-nav-btn--next" onClick={(e) => { e.stopPropagation(); goNextMonth(); }} title="下一月">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          {/* 年月选择器下拉 */}
          <div
            ref={pickerRef}
            className={`cal-picker-drop ${showPicker ? 'active' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cal-ym-row">
              <select
                value={viewYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <select
                value={viewMonth}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 日历网格 */}
        <div className="cal-grid">
          {/* 星期标题行 */}
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="cal-hd">
              {label}
            </div>
          ))}

          {/* 日期格子 */}
          {summaryLoading ? (
            Array.from({ length: 35 }).map((_, idx) => (
              <div key={idx} className="cal-cell" style={{ pointerEvents: 'none' }}>
                <div className="cd-date">
                  <Skeleton width="20px" height="12px" borderRadius="3px" />
                </div>
                <div className="cd-stats" style={{ opacity: 0.7 }}>
                  <Skeleton width="30px" height="9px" borderRadius="2px" />
                  <Skeleton width="30px" height="9px" borderRadius="2px" />
                  <Skeleton width="20px" height="9px" borderRadius="2px" />
                </div>
              </div>
            ))
          ) : (
            cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="cal-cell other" />;
              }

              const dayNum = parseInt(cell.date.slice(8, 10), 10);
              const isToday = cell.date === todayStr;
              const hasTransactions = cell.transaction_count > 0;

              return (
                <div
                  key={cell.date}
                  className={`cal-cell${isToday ? ' today' : ''}${selectedDate === cell.date ? ' active' : ''}`}
                  onClick={() => handleDateClick(cell.date)}
                >
                  <div className="cd-date">{dayNum}</div>
                  {hasTransactions && <div className="cal-dot" />}
                  {hasTransactions && (
                    <div className="cd-stats">
                      <div>{cell.total_expense > 0 && `支${formatAmount(cell.total_expense)}`}</div>
                      <div>{cell.total_income > 0 && `收${formatAmount(cell.total_income)}`}</div>
                      <div>{cell.transaction_count}笔</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 月度汇总卡片 */}
        <div className="cal-summary-row">
          {summaryLoading ? (
            <>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="80px" height="18px" />
              </div>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="80px" height="18px" />
              </div>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="60px" height="18px" />
              </div>
              <div className="cal-stat" style={{ pointerEvents: 'none' }}>
                <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                <Skeleton width="80px" height="18px" />
              </div>
            </>
          ) : (
            <>
              <div className="cal-stat">
                <div className="cs-lbl">总支出</div>
                <div className="cs-val exp">¥{formatAmount(monthStats.totalExpense)}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">总收入</div>
                <div className="cs-val inc">¥{formatAmount(monthStats.totalIncome)}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">总笔数</div>
                <div className="cs-val neutral">{monthStats.totalCount}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">结余</div>
                <div className={`cs-val ${monthStats.totalIncome - monthStats.totalExpense >= 0 ? 'inc' : 'exp'}`}>
                  ¥{formatAmount(monthStats.totalIncome - monthStats.totalExpense)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 选中日期的交易明细 */}
        {selectedDate && (
          <div id="calDayDetail" style={{ marginTop: 14 }}>
            <div className="card-header">
              {txsLoading ? (
                <Skeleton width="40%" height="14px" />
              ) : (
                <h3>
                  {selectedDate} · {dayTransactions.length}笔
                </h3>
              )}
              <span className="card-action" onClick={() => setSelectedDate(null)}>收起</span>
            </div>
            {txsLoading ? (
              <div className="txn-list" style={{ pointerEvents: 'none' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="txn-row">
                    <div className="txn-icon">
                      <Skeleton width="100%" height="100%" borderRadius="8px" />
                    </div>
                    <div className="txn-info">
                      <Skeleton width="50%" height="13px" marginBottom="4px" />
                      <Skeleton width="35%" height="11px" />
                    </div>
                    <Skeleton width="64px" height="14px" />
                  </div>
                ))}
              </div>
            ) : dayTransactions.length === 0 ? (
              <div className="calendar-empty">当天暂无交易记录</div>
            ) : (
              <div className="txn-list">
                {dayTransactions.map((item) => {
                  const isIncome = item.type === 'income';
                  const categoryName = getCategoryName(item.category);
                  const icon = getCategoryIcon(item.category);
                  const name = item.description || categoryName;

                  return (
                    <div key={item.id} className="txn-row">
                      <div className="txn-icon">{icon}</div>
                      <div className="txn-info">
                        <div className="txn-title">{name}</div>
                        <div className="txn-meta">
                          <span>{categoryName}</span>
                          <span>{item.created_at ? item.created_at.slice(11, 16) : ''}</span>
                        </div>
                      </div>
                      <div className={`txn-amount ${isIncome ? 'credit' : 'debit'}`}>
                        <span className="txn-sign">{isIncome ? '+' : '−'}</span>
                        {formatAmountWithType(parseFloat(String(item.amount)), isIncome)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
