/**
 * TemplateEdit picker value class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildTplPickerValueClassName(opts: {
  type?: string | null
  placeholder?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-picker-value'
  if (opts.placeholder || !opts.type) {
    return cx(prefix, `${prefix}--placeholder`, opts.className)
  }
  return cx(prefix, `${prefix}--${opts.type}`, opts.className)
}
