import React from 'react'

/**
 * 通用标签组件
 */
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export const Label: React.FC<LabelProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`ui-label ${className}`.trim()}
      {...props}
    >
      {children}
    </label>
  )
}

export default Label
