/**
 * DatePicker — Simple date picker for mobile.
 * Shows a small calendar-like grid for the current month.
 */

import React, { useState } from 'react';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const today = new Date();

  const handleSelect = (day: number) => {
    onChange(new Date(viewYear, viewMonth, day));
    onClose();
  };

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isSelected = (day: number): boolean =>
    value.getFullYear() === viewYear &&
    value.getMonth() === viewMonth &&
    value.getDate() === day;

  const isToday = (day: number): boolean =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const dayCells: React.ReactNode[] = [];

  // Empty cells for offset
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayCells.push(<div key={`empty-${i}`} />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const selected = isSelected(d);
    const todayFlag = isToday(d);
    dayCells.push(
      <button
        key={d}
        onClick={() => handleSelect(d)}
        className={`touch-target h-10 rounded-lg text-sm font-medium transition-colors ${
          selected
            ? 'bg-primary text-white'
            : todayFlag
            ? 'bg-primary-bg text-primary'
            : 'active:bg-gray-100 text-text'
        }`}
      >
        {d}
      </button>,
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrevMonth} className="touch-target text-text-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-base font-semibold">
            {viewYear}年{viewMonth + 1}月
          </span>
          <button onClick={goNextMonth} className="touch-target text-text-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs text-text-secondary py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">{dayCells}</div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-text-secondary text-sm font-medium active:bg-gray-50 rounded-xl"
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default DatePicker;
