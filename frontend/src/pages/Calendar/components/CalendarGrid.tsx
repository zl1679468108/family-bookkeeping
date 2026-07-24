import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { getLunarInfo, WEEKDAY_LABELS } from '../utils/lunarUtils';
import { formatMoney } from '../../../utils/budget';
import type { DailySummaryItem } from '@family-bookkeeping/shared-types';

interface CalendarGridProps {
  cells: (DailySummaryItem | null)[];
  todayStr: string;
  summaryLoading: boolean;
  onDateClick: (dateStr: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  cells, todayStr, summaryLoading, onDateClick,
}) => {
  return (
    <div className="cal-grid">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="cal-hd">{label}</div>
      ))}

      {summaryLoading ? (
        Array.from({ length: 35 }).map((_, idx) => (
          <div key={idx} className="cal-cell" style={{ pointerEvents: 'none' }}>
            <div className="cd-top">
              <div className="cd-date-wrap">
                <Skeleton width="24px" height="28px" borderRadius="3px" />
              </div>
            </div>
            <Skeleton width="36px" height="12px" borderRadius="2px" style={{ marginTop: '4px' }} />
            <Skeleton width="40px" height="12px" borderRadius="2px" style={{ marginTop: '4px' }} />
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
          const lunarInfo = getLunarInfo(cell.date);
          const subText = lunarInfo.subText;
          const isFestivalDay = lunarInfo.isLegalHoliday || lunarInfo.subText !== lunarInfo.lunarDayText;

          return (
            <div
              key={cell.date}
              className={`cal-cell${isToday ? ' today' : ''}${hasTransactions ? ' has-data' : ''}`}
              onClick={() => onDateClick(cell.date)}
            >
              <div className="cd-left">
                <div className="cd-date">{dayNum}</div>
                <div className={`cd-sub${isFestivalDay ? ' festival' : ''}`}>{subText}</div>
              </div>
              <div className="cd-mid">
                <div className="cd-stats">
                  <div className="cd-stat-row">
                    <span className="cd-stat-k">支</span>
                    <span className="cd-stat-v exp">{formatMoney(cell.total_expense, { compact: true })}</span>
                  </div>
                  <div className="cd-stat-row">
                    <span className="cd-stat-k">收</span>
                    <span className="cd-stat-v inc">{formatMoney(cell.total_income, { compact: true })}</span>
                  </div>
                  <div className="cd-stat-row">
                    <span className="cd-stat-v neutral">{cell.transaction_count}笔</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
