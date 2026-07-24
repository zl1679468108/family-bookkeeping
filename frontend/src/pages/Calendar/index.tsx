import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBook } from '../../hooks/useBook';
import { queryKeys } from '../../utils/queryKeys';
import { STALE } from '../../utils/cachePolicy';
import { fetchDailySummary } from '../../services/statisticsApi';
import { getTransactions } from '../../services/api';
import { Skeleton, DropdownSelect } from '../../components/ui';
import { CalendarGrid } from './components/CalendarGrid';
import { DateDetailModal } from './components/DateDetailModal';
import { daysInMonth, firstDayOfWeek, toMonthKey, generateMonthOptions } from './utils/lunarUtils';
import type { DailySummaryItem } from '@family-bookkeeping/shared-types';
import { formatMoney } from '../../utils/budget';

const Calendar: React.FC = () => {
  const { currentBook } = useBook();
  const bookId = currentBook?.id || '';
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const monthKey = toMonthKey(viewYear, viewMonth);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const currentMonthKey = useMemo(() => toMonthKey(viewYear, viewMonth), [viewYear, viewMonth]);

  const { data: dailyData = [], isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.statistics.dailySummary(bookId, monthKey),
    queryFn: () => fetchDailySummary({ month: monthKey }),
    enabled: !!bookId,
    staleTime: STALE.calendarDaily,
    refetchOnMount: false,
  });

  const { data: dayTransactions = [], isLoading: txsLoading } = useQuery({
    queryKey: queryKeys.transactions.byDate(bookId, selectedDate || ''),
    queryFn: async () => {
      if (!selectedDate) return [];
      const result = await getTransactions({ startDate: selectedDate, endDate: selectedDate, pageSize: 200 });
      return result.data;
    },
    enabled: !!selectedDate && !!bookId,
    staleTime: STALE.transactions,
  });

  const monthStats = useMemo(() => ({
    totalExpense: dailyData.reduce((sum, d) => sum + d.total_expense, 0),
    totalIncome: dailyData.reduce((sum, d) => sum + d.total_income, 0),
    totalCount: dailyData.reduce((sum, d) => sum + d.transaction_count, 0),
  }), [dailyData]);

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfWeek(viewYear, viewMonth);

  const dateMap = useMemo(() => {
    const map: Record<string, DailySummaryItem> = {};
    for (const item of dailyData) map[item.date] = item;
    return map;
  }, [dailyData]);

  const cells = useMemo(() => {
    const result: (DailySummaryItem | null)[] = [];
    for (let i = 0; i < startDow; i++) result.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push(dateMap[dateStr] || { date: dateStr, total_income: 0, total_expense: 0, transaction_count: 0 });
    }
    return result;
  }, [startDow, totalDays, viewYear, viewMonth, dateMap]);

  const goPrevMonth = useCallback(() => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  }, [viewMonth]);

  const goNextMonth = useCallback(() => {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  }, [viewMonth]);

  const handleMonthChange = useCallback((key: string) => {
    if (!key) return;
    const [y, m] = key.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m);
    setSelectedDate(null);
  }, []);

  const handleDateClick = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDetailModal(true);
  }, []);


  return (
    <div className="page-container">
      <div className="dash-card">
        <div className="cal-header-row">
          <button type="button" className="cal-nav-btn cal-nav-btn--prev" onClick={goPrevMonth} title="上一月" aria-label="上一月">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button type="button" className="cal-nav-btn cal-nav-btn--next" onClick={goNextMonth} title="下一月" aria-label="下一月">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          {summaryLoading ? (
            <Skeleton width="120px" height="28px" borderRadius="var(--rs)" />
          ) : (
            <DropdownSelect
              options={monthOptions}
              value={currentMonthKey}
              onChange={handleMonthChange}
              allowClear={false}
              width="auto"
              showSearch
              searchPlaceholder="搜索月份..."
            />
          )}
        </div>

        <CalendarGrid cells={cells} todayStr={todayStr} summaryLoading={summaryLoading} onDateClick={handleDateClick} />

        <div className="cal-summary-row">
          {summaryLoading ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="cal-stat" style={{ pointerEvents: 'none' }}>
                  <div className="cs-lbl"><Skeleton width="40px" height="11px" /></div>
                  <Skeleton width={i < 3 ? '80px' : '60px'} height="18px" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="cal-stat">
                <div className="cs-lbl">总支出</div>
                <div className="cs-val exp">{formatMoney(monthStats.totalExpense, { compact: true })}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">总收入</div>
                <div className="cs-val inc">{formatMoney(monthStats.totalIncome, { compact: true })}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">总笔数</div>
                <div className="cs-val neutral">{monthStats.totalCount}</div>
              </div>
              <div className="cal-stat">
                <div className="cs-lbl">结余</div>
                <div className={`cs-val ${monthStats.totalIncome - monthStats.totalExpense >= 0 ? 'inc' : 'exp'}`}>
                  {formatMoney(monthStats.totalIncome - monthStats.totalExpense, { compact: true })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <DateDetailModal
        open={showDetailModal}
        selectedDate={selectedDate}
        cellData={selectedDate ? dateMap[selectedDate] : undefined}
        dayTransactions={dayTransactions}
        txsLoading={txsLoading}
        onClose={() => { setShowDetailModal(false); setSelectedDate(null); }}
      />
    </div>
  );
};

export default Calendar;
