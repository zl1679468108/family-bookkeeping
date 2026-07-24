import React, { useId, useState, type InputHTMLAttributes } from 'react'
import { Icon } from '../Icon'
import { passwordVisibilityLabel } from '../../../utils/actionCopy'

/**
 * 鉴权/资料场景密码输入 —— 统一 password-wrapper + 显隐切换 + Icon。
 * 样式沿用全局 `.form-group` / `.form-input` / `.password-wrapper`，避免破坏 Auth 布局。
 */
export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  /** 标签文案；不传则不渲染 label */
  label?: React.ReactNode
  /** label class，如 `form-label field-required` */
  labelClassName?: string
  /** 外层 form-group 额外 class */
  groupClassName?: string
  /** input class，默认 form-input */
  inputClassName?: string
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  labelClassName,
  groupClassName = '',
  inputClassName = 'form-input',
  id,
  disabled,
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className={`form-group ${groupClassName}`.trim()}>
      {label != null && label !== '' && (
        <label htmlFor={inputId} className={labelClassName}>
          {label}
        </label>
      )}
      <div className="password-wrapper">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={inputClassName}
          disabled={disabled}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          disabled={disabled}
          aria-label={passwordVisibilityLabel(visible)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={16} />
        </button>
      </div>
    </div>
  )
}

export default PasswordField
