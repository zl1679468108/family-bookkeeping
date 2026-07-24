import React, { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../../utils/cx'

/**
 * 通用表单字段 —— form-group + label + input。
 * 与 PasswordField 配套；鉴权页靠 AuthLayout 的 `.auth-form input` 样式，
 * 资料页等可传 className="form-input"。
 *
 * 若传 children，则只渲染 label + children（用于验证码行等自定义控件）；
 * 此时建议传 id 与内部控件 id 对齐，以便 label 正确关联。
 */
export interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label?: ReactNode
  labelClassName?: string
  groupClassName?: string
  children?: ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  labelClassName,
  groupClassName = '',
  id,
  children,
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const labelFor = children ? id : inputId

  return (
    <div className={cx('form-group', groupClassName)}>
      {label != null && label !== '' && (
        <label htmlFor={labelFor} className={labelClassName}>
          {label}
        </label>
      )}
      {children ?? <input id={inputId} {...inputProps} />}
    </div>
  )
}

export default FormField
