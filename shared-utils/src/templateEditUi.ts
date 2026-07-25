/**
 * TemplateEdit picker value class — Taro
 */

import { cx, type ClassValue } from './cx'

export function buildTplPickerValueClassName(opts: {
  type?: string | null
  placeholder?: boolean
  placeholderClass?: string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'tpl-picker-value'
  if (opts.placeholder) {
    return cx(prefix, opts.placeholderClass || `${prefix}--placeholder`, opts.className)
  }
  if (!opts.type) return cx(prefix, opts.className)
  return cx(prefix, `${prefix}--${opts.type}`, opts.className)
}
