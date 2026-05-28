import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
  ...props
}) => {
  // danger 用内联样式（Tailwind 未配置 danger 色值）
  if (variant === 'danger') {
    return (
      <button
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${className}`}
        style={{
          color: 'var(--danger)',
          border: '1px solid oklch(60% 0.18 25 / 30%)',
          background: 'transparent',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          opacity: props.disabled ? 0.5 : 1,
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!props.disabled) {
            e.currentTarget.style.background = 'oklch(60% 0.18 25 / 6%)';
            e.currentTarget.style.borderColor = 'oklch(60% 0.18 25 / 40%)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'oklch(60% 0.18 25 / 30%)';
        }}
        {...props}
      >
        {children}
      </button>
    )
  }

  const baseStyles = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200'

  const variantStyles: Record<string, string> = {
    default: 'bg-accent text-white hover:bg-accent-hover',
    outline: 'border border-border bg-transparent text-fg hover:bg-surface/50',
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-surface text-fg border border-border hover:bg-bg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  )
}
