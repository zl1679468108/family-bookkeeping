import React from 'react'
import { cx } from '../../../utils/cx'

/**
 * 通用分段控制器 —— 取代各页面手写的 tab 切换结构
 *
 * 用法：
 *  <SegControl
 *    options={[
 *      { value: 'expense', label: '支出' },
 *      { value: 'income', label: '收入' },
 *    ]}
 *    value={activeTab}
 *    onChange={setActiveTab}
 *  />
 */
export interface SegOption<T extends string = string> {
  value: T
  label: React.ReactNode
  icon?: React.ReactNode
}

interface SegControlProps<T extends string = string> {
  options: SegOption<T>[]
  value?: T
  onChange?: (value: T) => void
  className?: string
  style?: React.CSSProperties
  size?: 'sm' | 'md'
  variant?: 'default' | 'pill'
}

export function SegControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
  style,
  size = 'md',
  variant = 'default',
}: SegControlProps<T>) {
  return (
    <div className={cx('seg-control', `seg-control--${size}`, `seg-control--${variant}`, className)} style={style}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`seg-opt ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange?.(opt.value)}
        >
          {opt.icon && <span className="seg-opt__icon">{opt.icon}</span>}
          <span className="seg-opt__label">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

export default SegControl
