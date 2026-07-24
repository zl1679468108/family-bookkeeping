import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '../Icon'

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
  isHeader?: boolean
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
  /** 是否显示搜索框 */
  showSearch?: boolean
  /** 搜索框占位符 */
  searchPlaceholder?: string
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
  showSearch = false,
  searchPlaceholder = '搜索...',
}) => {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState<string | null>(value ?? null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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

  // 打开时自动聚焦搜索框
  useEffect(() => {
    if (open && showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    } else if (!open) {
      setSearchKeyword('')
    }
  }, [open, showSearch])

  // 打开且有选中值时，自动滚动到选中项在面板中间（参考图1→图2效果）
  useEffect(() => {
    if (!open) return
    const hasValue = internalValue !== null && internalValue !== ''
    if (!hasValue) return
    // 等 DOM 渲染完成后再滚动（+100ms 确保面板已展开）
    const timer = setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const activeEl = panel.querySelector('.dd-select__item.is-active') as HTMLElement | null
      if (!activeEl) return
      const panelRect = panel.getBoundingClientRect()
      const itemRect = activeEl.getBoundingClientRect()
      // 计算选中项相对于面板可滚动区域的偏移
      const panelScrollTop = panel.scrollTop
      const panelHeight = panel.clientHeight
      const itemCenter = itemRect.top - panelRect.top + panelScrollTop + itemRect.height / 2
      const targetScroll = itemCenter - panelHeight / 2
      panel.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [open, internalValue])

  const currentOption = options.find((o) => o.key === internalValue)
  const hasValue = internalValue !== null && internalValue !== ''

  // 根据搜索关键词过滤选项
  const filteredOptions = showSearch && searchKeyword
    ? options.filter((o) => o.label.toLowerCase().includes(searchKeyword.toLowerCase()))
    : options

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
            <Icon name="close" size={12} strokeWidth={2.5} />
          </span>
        )}
        <span className="dd-select__chevron"><Icon name="chevron-down" size={14} /></span>
      </button>

      {open && (
        <div ref={panelRef} className={`dd-select__panel dd-select__panel--${align}`} role="listbox">
          {showSearch && (
            <div className="dd-select__search">
              <input
                ref={searchInputRef}
                type="text"
                className="dd-select__search-input"
                placeholder={searchPlaceholder}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
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
          {filteredOptions.map((opt) => {
            if (opt.isHeader) {
              return (
                <div key={opt.key} className="dd-select__group-header" role="presentation">
                  <span>{opt.label}</span>
                </div>
              )
            }
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
