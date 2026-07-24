/**
 * TemplateSelector class — PC 记一笔选模板
 */

import { cx, type ClassValue } from './cx'

export function buildTemplateItemClassName(opts: {
  selected?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'template-item'
  return cx(prefix, opts.selected && 'selected', opts.className)
}

export function buildTemplateTypeClassName(opts: {
  type?: string | null
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'template-type'
  return cx(prefix, opts.type, opts.className)
}

export function buildTemplateRadioClassName(opts: {
  checked?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'template-radio'
  return cx(prefix, opts.checked && 'checked', opts.className)
}
