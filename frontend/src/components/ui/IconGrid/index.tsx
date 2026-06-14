import React from 'react'
import './index.scss'

/**
 * 通用图标网格选择器
 *
 * 用法：
 *  <IconGrid
 *    options={[{ value: 'book', icon: '📖', label: '账本' }]}
 *    value={selectedValue}
 *    onChange={setSelectedValue}
 *  />
 */
export interface IconGridOption {
  value: string
  icon: React.ReactNode
  label?: string
}

interface IconGridProps {
  options: IconGridOption[]
  value?: string
  onChange?: (value: string) => void
  columns?: number
  className?: string
}

export const IconGrid: React.FC<IconGridProps> = ({
  options,
  value,
  onChange,
  columns = 5,
  className = '',
}) => {
  return (
    <div
      className={`icon-grid ${className}`.trim()}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            className={`icon-btn ${active ? 'active' : ''}`}
            onClick={() => onChange?.(opt.value)}
          >
            <span className="icon-btn-emoji">{opt.icon}</span>
            {opt.label && <span className="icon-btn-label">{opt.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default IconGrid
