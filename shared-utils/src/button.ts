/**
 * 通用按钮 class / 变体 — PC / Taro Button 共用（端侧各自渲染节点）
 */

import { cx, type ClassValue } from './cx'

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type BuildUiButtonClassNameOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  loading?: boolean
  disabled?: boolean
  className?: ClassValue
  /** 根 class，默认 ui-btn */
  prefix?: string
}

/** 组装 ui-btn / ui-btn--primary 等 class */
export function buildUiButtonClassName(opts: BuildUiButtonClassNameOptions = {}): string {
  const {
    variant = 'default',
    size = 'md',
    block = false,
    loading = false,
    disabled = false,
    className = '',
    prefix = 'ui-btn',
  } = opts
  return cx(
    prefix,
    `${prefix}--${variant}`,
    `${prefix}--${size}`,
    block && `${prefix}--block`,
    loading && `${prefix}--loading`,
    disabled && `${prefix}--disabled`,
    className,
  )
}
