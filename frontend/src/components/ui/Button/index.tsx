import React from 'react'
import './index.scss'

/**
 * 通用按钮组件 —— 取代各页面手写的 button + 内联样式
 *
 * 用法：
 *  <Button variant="primary" onClick={handleSubmit}>保存</Button>
 *  <Button variant="secondary" icon="＋">新建</Button>
 *  <Button variant="danger" onClick={handleDelete}>删除</Button>
 *  <Button variant="ghost" size="sm">取消</Button>
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  children?: React.ReactNode
  block?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  block = false,
  style,
  ...props
}) => {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    block ? 'ui-btn--block' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={classes} style={style} {...props}>
      {icon && <span className="ui-btn-icon">{icon}</span>}
      {children && <span className="ui-btn-text">{children}</span>}
    </button>
  )
}

export default Button
