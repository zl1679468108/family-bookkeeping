import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.scss';

interface FilterPanelProps {
  expanded: boolean;
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  onMinAmountChange: (v: string) => void;
  onMaxAmountChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onToggle: () => void;
}

const DEBOUNCE_MS = 300;

/** 防抖 Hook：value 变化后 delay ms 再调用 callback */
const useDebounce = (value: string, callback: (v: string) => void, delay: number) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      callbackRef.current(value);
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, delay]);
};

export const FilterPanel: React.FC<FilterPanelProps> = ({
  expanded, minAmount, maxAmount, dateFrom, dateTo,
  onMinAmountChange, onMaxAmountChange, onDateFromChange, onDateToChange, onToggle,
}) => {
  // 本地 state：立即响应 UI 输入
  const [localMinAmount, setLocalMinAmount] = useState(minAmount);
  const [localMaxAmount, setLocalMaxAmount] = useState(maxAmount);
  const [localDateFrom, setLocalDateFrom] = useState(dateFrom);
  const [localDateTo, setLocalDateTo] = useState(dateTo);

  // 同步外部值（Chip 清除时可能有延迟）
  useEffect(() => setLocalMinAmount(minAmount), [minAmount]);
  useEffect(() => setLocalMaxAmount(maxAmount), [maxAmount]);
  useEffect(() => setLocalDateFrom(dateFrom), [dateFrom]);
  useEffect(() => setLocalDateTo(dateTo), [dateTo]);

  // 防抖触发父组件 onChange
  useDebounce(localMinAmount, onMinAmountChange, DEBOUNCE_MS);
  useDebounce(localMaxAmount, onMaxAmountChange, DEBOUNCE_MS);
  useDebounce(localDateFrom, onDateFromChange, DEBOUNCE_MS);
  useDebounce(localDateTo, onDateToChange, DEBOUNCE_MS);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={onToggle}
        className={`filter-panel-toggle ${expanded ? 'active' : ''}`}
      >
        <svg className="filter-panel-toggle__icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        高级筛选
        <span>{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="filter-panel-content">
          <div className="filter-panel-group">
            <span className="filter-panel-label">金额</span>
            <input
              type="number"
              placeholder="最小"
              value={localMinAmount}
              onChange={e => setLocalMinAmount(e.target.value)}
              className="filter-panel-input"
            />
            <span className="filter-panel-sep">~</span>
            <input
              type="number"
              placeholder="最大"
              value={localMaxAmount}
              onChange={e => setLocalMaxAmount(e.target.value)}
              className="filter-panel-input"
            />
          </div>
          <div className="filter-panel-group">
            <span className="filter-panel-label">日期</span>
            <input
              type="date"
              value={localDateFrom}
              onChange={e => setLocalDateFrom(e.target.value)}
              className="filter-panel-input"
            />
            <span className="filter-panel-sep">~</span>
            <input
              type="date"
              value={localDateTo}
              onChange={e => setLocalDateTo(e.target.value)}
              className="filter-panel-input"
            />
          </div>
        </div>
      )}
    </div>
  );
};
