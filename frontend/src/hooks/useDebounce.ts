import { useState, useEffect } from 'react';
import { DEBOUNCE_DEFAULT_MS } from '../utils/timing';

/**
 * 防抖 hook
 * @param value 需要防抖的值
 * @param delay 延迟时间（ms），默认 300
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DEFAULT_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
