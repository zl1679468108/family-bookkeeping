import React, { useMemo, useCallback, useState } from 'react';
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
  const [customOpen, setCustomOpen] = useState(false);

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
        label: '上月',
        key: 'last-month',
        getRange: () => {
          const now = new Date();
          const prev = subMonths(now, 1);
          return { start: fmt(startOfMonth(prev)), end: fmt(endOfMonth(prev)) };
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
    // 如果有自定义区间在展示，则高亮"自定义"
    return customOpen ? 'custom' : null;
  }, [startDate, endDate, presets, customOpen]);

  const handlePresetClick = useCallback(
    (preset: PresetOption) => {
      const { start, end } = preset.getRange();
      setCustomOpen(false);
      onChange(start, end);
    },
    [onChange],
  );

  const handleCustomToggle = () => {
    setCustomOpen((prev) => !prev);
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    const newStart = field === 'start' ? value : startDate;
    const newEnd = field === 'end' ? value : endDate;
    if (newStart && newEnd) {
      onChange(newStart, newEnd);
    }
  };

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

      {/* 自定义时间按钮 */}
      <button
        className={`date-range-filter__btn ${activeKey === 'custom' ? 'date-range-filter__btn--active' : ''}`}
        onClick={handleCustomToggle}
        type="button"
      >
        自定义
      </button>

      {/* 自定义时间范围输入框 */}
      {customOpen && (
        <div className="date-range-filter__custom">
          <div className="date-range-filter__custom-field">
            <label className="date-range-filter__custom-label">起</label>
            <input
              type="date"
              className="date-range-filter__custom-input"
              value={startDate}
              max={endDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
            />
          </div>
          <span className="date-range-filter__custom-sep">—</span>
          <div className="date-range-filter__custom-field">
            <label className="date-range-filter__custom-label">止</label>
            <input
              type="date"
              className="date-range-filter__custom-input"
              value={endDate}
              min={startDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
