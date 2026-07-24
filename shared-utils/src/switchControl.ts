/**
 * Switch class — Taro ui-switch（PC 若引入可复用）
 */

import { cx, type ClassValue } from './cx'

export function buildSwitchClassName(opts: {
  checked?: boolean
  disabled?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-switch'
  return cx(
    prefix,
    opts.checked && `${prefix}--on`,
    opts.disabled && `${prefix}--disabled`,
    opts.className,
  )
}
