import { Icon } from '../Icon'
import React, { TextareaHTMLAttributes, useState, useEffect, useRef, useId } from 'react'
import {
  shouldShowInputClear,
  formatCharCount,
  buildTextareaWrapClassName,
  buildTextareaClassName,
  fieldRequiredClassName,
} from '../../../utils/inputHelpers'
import { ACTION_CLEAR } from '../../../utils/actionCopy'

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
  const generatedId = useId()
  const textareaId = id || generatedId
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
    <div className={buildTextareaWrapClassName({ className: wrapperClassName, mode: 'pc' })}>
      {label && (
        <label htmlFor={textareaId} className={fieldRequiredClassName('ui-input-label', required)}>
          {label}
        </label>
      )}
      <div className={buildTextareaClassName({ error: !!error, className, mode: 'pc' })}>
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={currentValue}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {shouldShowInputClear(allowClear, currentValue) && (
          <button type="button" className="ui-textarea-clear" onClick={handleClear} aria-label={ACTION_CLEAR}>
            <Icon name="close" size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>
      {(showCount || error) && (
        <div className="ui-textarea-footer">
          {error && <span className="ui-input-error">{error}</span>}
          {showCount && (
            <span className="ui-textarea-count">
              {maxLength ? formatCharCount(charCount, maxLength as number) : charCount}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Textarea
