import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'primary' | 'secondary'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200'
  
  const variantStyles: Record<string, string> = {
    default: 'bg-accent text-white hover:bg-accent-hover',
    outline: 'border border-border bg-transparent text-fg hover:bg-surface/50',
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-surface text-fg border border-border hover:bg-bg'
  }
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  )
}