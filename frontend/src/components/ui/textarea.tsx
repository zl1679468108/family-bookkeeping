import React, { TextareaHTMLAttributes, useState, useEffect, useRef } from 'react'
import './input.scss'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  allowClear?: boolean;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  id,
  allowClear = false,
  showCount = false,
  maxLength,
  value,
  defaultValue,
  onChange,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(
    isControlled ? (value as string) ?? '' : (defaultValue as string) ?? ''
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isControlled) {
      setInternalValue((value as string) ?? '')
    }
  }, [value, isControlled])

  const currentValue = isControlled ? (value as string) ?? '' : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    const event = { target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>
    onChange?.(event)
    textareaRef.current?.focus()
  }

  const charCount = currentValue.length

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${allowClear && currentValue ? 'pr-8' : ''}
            ${className}
          `}
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {allowClear && currentValue && (
          <button
            type="button"
            className="input-clear-btn"
            onClick={handleClear}
            aria-label="清空"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {showCount && (
        <div className="text-right mt-1 text-sm text-gray-500">
          {charCount}{maxLength ? ` / ${maxLength}` : ''}
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default Textarea;
