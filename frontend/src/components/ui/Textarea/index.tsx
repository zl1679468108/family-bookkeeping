import React, { TextareaHTMLAttributes, useState, useEffect, useRef } from 'react'
import './index.scss'

/**
 * 通用文本域组件 —— 取代各页面手写的 `<textarea>` 结构
 *
 * 用法：
 *  <Textarea value={desc} onChange={setDesc} placeholder="描述…" />
 *  <Textarea value={note} onChange={setNote} showCount maxLength={200} />
 */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  allowClear?: boolean
  showCount?: boolean
  autoResize?: boolean
  wrapperClassName?: string
  required?: boolean
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  wrapperClassName = '',
  id,
  allowClear = false,
  showCount = false,
  maxLength,
  value,
  defaultValue,
  onChange,
  required,
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
    <div className={`ui-textarea-wrap ${wrapperClassName}`.trim()}>
      {label && (
        <label htmlFor={textareaId} className={`ui-input-label${required ? ' field-required' : ''}`}>
          {label}
        </label>
      )}
      <div className={`ui-textarea ${error ? 'has-error' : ''} ${className}`.trim()}>
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {allowClear && currentValue && (
          <button type="button" className="ui-textarea-clear" onClick={handleClear} aria-label="清空">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {(showCount || error) && (
        <div className="ui-textarea-footer">
          {error && <span className="ui-input-error">{error}</span>}
          {showCount && (
            <span className="ui-textarea-count">
              {charCount}{maxLength ? ` / ${maxLength}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Textarea
