import React, { useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import './index.scss';

interface DateRangeFilterProps {
  startDate: string; // "2025-05-01"
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

interface PresetOption {
  label: string;
  key: string;
  getRange: () => { start: string; end: string };
}

/** Format a Date object to "YYYY-MM-DD" string */
const fmt = (d: Date): string => format(d, 'yyyy-MM-dd');

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const presets: PresetOption[] = useMemo(
    () => [
      {
        label: '本月',
        key: 'this-month',
        getRange: () => {
          const now = new Date();
          return { start: fmt(startOfMonth(now)), end: fmt(endOfMonth(now)) };
        },
      },
      {
        label: '近3月',
        key: 'last-3-months',
        getRange: () => {
          const now = new Date();
          return {
            start: fmt(startOfMonth(subMonths(now, 2))),
            end: fmt(endOfMonth(now)),
          };
        },
      },
      {
        label: '近6月',
        key: 'last-6-months',
        getRange: () => {
          const now = new Date();
          return {
            start: fmt(startOfMonth(subMonths(now, 5))),
            end: fmt(endOfMonth(now)),
          };
        },
      },
      {
        label: '近1年',
        key: 'last-1-year',
        getRange: () => {
          const now = new Date();
          return {
            start: fmt(startOfMonth(subMonths(now, 11))),
            end: fmt(endOfMonth(now)),
          };
        },
      },
    ],
    [],
  );

  /** Detect which preset (if any) matches the current date range */
  const activeKey = useMemo(() => {
    for (const preset of presets) {
      const { start, end } = preset.getRange();
      if (start === startDate && end === endDate) {
        return preset.key;
      }
    }
    return null;
  }, [startDate, endDate, presets]);

  const handlePresetClick = useCallback(
    (preset: PresetOption) => {
      const { start, end } = preset.getRange();
      onChange(start, end);
    },
    [onChange],
  );

  return (
    <div className="date-range-filter">
      {presets.map((preset) => (
        <button
          key={preset.key}
          className={`date-range-filter__btn ${activeKey === preset.key ? 'date-range-filter__btn--active' : ''}`}
          onClick={() => handlePresetClick(preset)}
          type="button"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
};
