/**
 * MonthPicker — Month selector with left/right arrow navigation.
 * Displays "YYYY年M月" format.
 */

import React from 'react';

interface MonthPickerProps {
  year: number;
  month: number; // 1-12
  onChange: (year: number, month: number) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ year, month, onChange }) => {
  const goPrev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const goNext = () => {
    const now = new Date();
    const maxMonth = now.getMonth() + 1;
    const maxYear = now.getFullYear();
    if (year === maxYear && month >= maxMonth) return;
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;
  const isNextDisabled =
    year === new Date().getFullYear() && month >= new Date().getMonth() + 1;

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <button
        onClick={goPrev}
        className="touch-target text-text-secondary active:text-primary transition-colors"
        aria-label="上个月"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="text-base font-semibold min-w-[100px] text-center">
        {year}年{month}月
      </span>

      <button
        onClick={goNext}
        disabled={isNextDisabled}
        className={`touch-target transition-colors ${
          isNextDisabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-text-secondary active:text-primary'
        }`}
        aria-label="下个月"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default MonthPicker;
