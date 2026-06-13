import React, { useState, useRef, useEffect } from 'react';
import './dropdown.scss';

export interface DropdownOption {
  key: string;
  label: string;
  icon?: string; // emoji or short text prefix
  color?: string; // optional color dot
}

interface DropdownSelectProps {
  /** 下拉标签，显示在当前选中值的前面 */
  label?: string;
  /** 下拉框内的选项 */
  options: DropdownOption[];
  /** 当前选中的 key；不传则为非受控 */
  value?: string | null;
  /** 选中回调 */
  onChange?: (key: string) => void;
  /** 无选中时展示的占位符 */
  placeholder?: string;
  /** 自定义 class */
  className?: string;
  /** 是否可清空（点击"全部"或首项清空）；默认 true */
  clearable?: boolean;
}

export const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = '全部',
  className = '',
  clearable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | null>(value ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  // sync from parent
  useEffect(() => {
    if (value !== undefined) setInternalValue(value);
  }, [value]);

  // click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentOption = options.find(o => o.key === internalValue);
  const displayText = currentOption ? currentOption.label : placeholder;
  const displayIcon = currentOption?.icon;

  const handleSelect = (key: string) => {
    const next = (clearable && internalValue === key) ? null : key;
    setInternalValue(next);
    onChange?.(next ?? '');
    setOpen(false);
  };

  return (
    <div className={`dd-select ${open ? 'is-open' : ''} ${className}`} ref={containerRef}>
      <button
        type="button"
        className="dd-select__btn"
        onClick={() => setOpen(v => !v)}
      >
        {label && <span className="dd-select__label">{label}</span>}
        {displayIcon && <span className="dd-select__icon">{displayIcon}</span>}
        <span className="dd-select__value">{displayText}</span>
        <span className="dd-select__chevron">▾</span>
      </button>

      {open && (
        <div className="dd-select__panel" role="listbox">
          {clearable && (
            <div
              className={`dd-select__item ${internalValue === null || internalValue === '' ? 'is-active' : ''}`}
              onClick={() => handleSelect('')}
              role="option"
              aria-selected={internalValue === null || internalValue === ''}
            >
              <span className="dd-select__item-icon">✓</span>
              <span className="dd-select__item-label">{placeholder}</span>
            </div>
          )}
          {options.map(opt => {
            const active = opt.key === internalValue;
            return (
              <div
                key={opt.key}
                className={`dd-select__item ${active ? 'is-active' : ''}`}
                onClick={() => handleSelect(opt.key)}
                role="option"
                aria-selected={active}
              >
                {opt.color ? (
                  <span
                    className="dd-select__item-color"
                    style={{ background: opt.color }}
                  />
                ) : opt.icon ? (
                  <span className="dd-select__item-icon">{opt.icon}</span>
                ) : (
                  <span className="dd-select__item-icon">{active ? '✓' : ''}</span>
                )}
                <span className="dd-select__item-label">{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownSelect;
