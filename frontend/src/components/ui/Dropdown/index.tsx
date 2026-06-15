import React, { useState, useRef, useEffect } from 'react'
import './index.scss'

/**
 * 通用下拉选择组件 —— 取代各页面手写的 <select> 和自定义下拉
 *
 * 用法：
 *  <DropdownSelect
 *    options={[{ key: 'expense', label: '支出' }, { key: 'income', label: '收入' }]}
 *    value={type}
 *    onChange={setType}
 *  />
 */
export interface DropdownOption {
  key: string
  label: string
  icon?: React.ReactNode
  color?: string
}

interface DropdownSelectProps {
  label?: string
  options: DropdownOption[]
  value?: string | null
  onChange?: (key: string) => void
  placeholder?: string
  className?: string
  allowClear?: boolean
  width?: string | number
  align?: 'left' | 'right'
  required?: boolean
}

export const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = '全部',
  className = '',
  allowClear = true,
  width,
  align = 'left',
  required,
}) => {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState<string | null>(value ?? null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (value !== undefined) setInternalValue(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const currentOption = options.find((o) => o.key === internalValue)
  const hasValue = internalValue !== null && internalValue !== ''

  const handleSelect = (key: string) => {
    setInternalValue(key)
    onChange?.(key)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalValue(null)
    onChange?.('')
    inputRef.current?.focus()
  }

  return (
    <div
      className={`dd-select ${open ? 'is-open' : ''} ${className}`.trim()}
      ref={containerRef}
      style={width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
    >
      <button
        ref={inputRef}
        type="button"
        className="dd-select__btn"
        onClick={() => setOpen((v) => !v)}
      >
        {label && <span className={`dd-select__label${required ? ' field-required' : ''}`}>{label}</span>}
        {currentOption?.icon && <span className="dd-select__icon">{currentOption.icon}</span>}
        <span className="dd-select__value">{currentOption ? currentOption.label : placeholder}</span>
        {allowClear && hasValue && (
          <span className="dd-select__clear" onClick={handleClear} role="button" aria-label="清空">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        )}
        <span className="dd-select__chevron">▾</span>
      </button>

      {open && (
        <div className={`dd-select__panel dd-select__panel--${align}`} role="listbox">
          {allowClear && (
            <div
              className={`dd-select__item ${!hasValue ? 'is-active' : ''}`}
              onClick={() => handleSelect('')}
              role="option"
              aria-selected={!hasValue}
            >
              <span className="dd-select__item-icon">✓</span>
              <span className="dd-select__item-label">{placeholder}</span>
            </div>
          )}
          {options.map((opt) => {
            const active = opt.key === internalValue
            return (
              <div
                key={opt.key}
                className={`dd-select__item ${active ? 'is-active' : ''}`}
                onClick={() => handleSelect(opt.key)}
                role="option"
                aria-selected={active}
              >
                {opt.color ? (
                  <span className="dd-select__item-color" style={{ background: opt.color }} />
                ) : opt.icon ? (
                  <span className="dd-select__item-icon">{opt.icon}</span>
                ) : (
                  <span className="dd-select__item-icon">{active ? '✓' : ''}</span>
                )}
                <span className="dd-select__item-label">{opt.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DropdownSelect
