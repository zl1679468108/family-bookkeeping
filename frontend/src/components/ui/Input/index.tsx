import React, { InputHTMLAttributes, useState, useEffect, useRef, useId } from 'react'
import {
  shouldShowInputClear,
  resolvePasswordInputType,
  buildInputWrapClassName,
  buildInputClassName,
  fieldRequiredClassName,
  buildSearchWrapClassName,
  buildSearchFieldClassName,
  buildNumberFieldClassName,
  buildSelectWrapClassName,
  buildSelectFieldClassName,
  buildPcInputShellClassName,
} from '../../../utils/inputHelpers'
import { Icon } from '../Icon'
import { ACTION_CLEAR, ACTION_SEARCH_ELLIPSIS,
  passwordVisibilityLabel,
} from '../../../utils/actionCopy'

/**
 * 通用输入框组件 —— 取代各页面手写的 `<input>` + `<div className="form-input">` 结构
 *
 * 用法：
 *  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入" />
 *  <Input value={search} onChange={(e) => setSearch(e.target.value)} icon="🔍" />
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  allowClear?: boolean
  icon?: React.ReactNode
  wrapperClassName?: string
  required?: boolean
  showPasswordToggle?: boolean
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  wrapperClassName = '',
  id,
  allowClear = false,
  icon,
  value,
  defaultValue,
  onChange,
  required,
  showPasswordToggle = false,
  ...props
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(
    isControlled ? (value as string) ?? '' : (defaultValue as string) ?? ''
  )
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isControlled) {
      setInternalValue((value as string) ?? '')
    }
  }, [value, isControlled])

  const currentValue = isControlled ? (value as string) ?? '' : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value)
    }
    onChange?.(e)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isControlled) {
      setInternalValue('')
    }
    const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>
    onChange?.(event)
    inputRef.current?.focus()
  }

  return (
    <div className={buildInputWrapClassName({ className: wrapperClassName, mode: 'pc' })}>
      {label && (
        <label htmlFor={inputId} className={fieldRequiredClassName('ui-input-label', required)}>
          {label}
        </label>
      )}
      <div className={buildInputClassName({ error: !!error, className, mode: 'pc' })}>
        {icon && <span className="ui-input-icon">{icon}</span>}
        <input
          ref={inputRef}
          id={inputId}
          value={currentValue}
          onChange={handleChange}
          {...props}
          type={resolvePasswordInputType(props.type, showPasswordToggle, showPassword)}
        />
        {showPasswordToggle && props.type === 'password' && (
          <button
            type="button"
            className="ui-input-password-toggle"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={passwordVisibilityLabel(showPassword)}
          >
            {showPassword ? <Icon name="eye-off" size={16} /> : <Icon name="eye" size={16} />}
          </button>
        )}
        {shouldShowInputClear(allowClear, currentValue, props.disabled) && (
          <button type="button" className="ui-input-clear" onClick={handleClear} aria-label={ACTION_CLEAR}>
            <Icon name="close" size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
      {error && <p className="ui-input-error">{error}</p>}
    </div>
  )
}

/**
 * 搜索输入框 —— 内置放大镜图标，取代页面中常见的 `<div className="srch-wrap">` 结构
 *
 * 用法：
 *  <SearchInput value={keyword} onChange={setKeyword} placeholder="搜索描述/品牌…" />
 */
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  wrapperClassName?: string
  allowClear?: boolean
  icon?: React.ReactNode
  width?: string | number
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = ACTION_SEARCH_ELLIPSIS,
  className = '',
  wrapperClassName = '',
  allowClear = true,
  icon,
  width,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div
      className={buildSearchWrapClassName({ className: wrapperClassName })}
      style={width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : undefined}
    >
      <span className="ui-search-icon">
        {icon || (
          <Icon name="search" size={14} />
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        className={buildSearchFieldClassName({ className })}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        autoComplete="off"
        name="search-field"
      />
      {shouldShowInputClear(allowClear, value) && (
        <span className="ui-search-clear" onClick={handleClear} role="button" aria-label={ACTION_CLEAR}>
          <Icon name="close" size={12} strokeWidth={2.5} />
        </span>
      )}
    </div>
  )
}

/**
 * 数字输入框 —— 取代页面中金额、数量等场景的 `<input type="number">`
 *
 * 用法：
 *  <NumberInput value={amount} onChange={setAmount} prefix="¥" placeholder="0.00" />
 */
interface NumberInputProps {
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  label?: string
  className?: string
  wrapperClassName?: string
  disabled?: boolean
  min?: number
  max?: number
  step?: string | number
  required?: boolean
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  label,
  className = '',
  wrapperClassName = '',
  disabled = false,
  min,
  max,
  step = '0.01',
  required,
}) => {
  return (
    <div className={buildInputWrapClassName({ className: wrapperClassName, mode: 'pc' })}>
      {label && <label className={fieldRequiredClassName('ui-input-label', required)}>{label}</label>}
      <div className={buildPcInputShellClassName({ disabled })}>
        {prefix && <span className="ui-input-prefix">{prefix}</span>}
        <input
          type="number"
          className={buildNumberFieldClassName({ className })}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span className="ui-input-suffix">{suffix}</span>}
      </div>
    </div>
  )
}

/**
 * 下拉选择框组件 —— 取代页面中手写的 `<select>` 结构
 *
 * 用法：
 *  <Select value={type} onChange={setType} options={[{ value: 'expense', label: '支出' }]} />
 */
interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  wrapperClassName?: string
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  disabled = false,
  className = '',
  wrapperClassName = '',
}) => {
  return (
    <div className={buildSelectWrapClassName({ className: wrapperClassName })}>
      {label && <label className="ui-input-label">{label}</label>}
      <div className={buildPcInputShellClassName({ disabled })}>
        <select
          className={buildSelectFieldClassName({ className })}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default Input
