import React, { useState, useEffect, useRef, useCallback } from 'react';

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

const inputStyle: React.CSSProperties = {
  padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)',
  fontSize: 13, width: 120, background: 'var(--surface)', color: 'var(--fg)',
};

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
      <button onClick={onToggle} style={{
        padding: '4px 12px', fontSize: 13, border: '1px solid var(--border)',
        borderRadius: 6, background: 'var(--surface)', color: 'var(--fg)', cursor: 'pointer',
      }}>
        高级筛选 {expanded ? '▾' : '▸'}
      </button>
      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>金额</span>
          <input type="number" placeholder="最小" value={localMinAmount}
            onChange={e => setLocalMinAmount(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--muted)' }}>~</span>
          <input type="number" placeholder="最大" value={localMaxAmount}
            onChange={e => setLocalMaxAmount(e.target.value)} style={inputStyle} />
          <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 8 }}>日期</span>
          <input type="date" value={localDateFrom}
            onChange={e => setLocalDateFrom(e.target.value)} style={inputStyle} />
          <span style={{ color: 'var(--muted)' }}>~</span>
          <input type="date" value={localDateTo}
            onChange={e => setLocalDateTo(e.target.value)} style={inputStyle} />
        </div>
      )}
    </div>
  );
};
