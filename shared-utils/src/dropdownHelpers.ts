import { cx, type ClassValue } from './cx'

/**
 * Dropdown / DropdownSelect 纯逻辑
 * 过滤、选中查找、是否有值
 */

export type LabeledOption = { label: string }
export type KeyedOption = { key: string }

/**
 * 按任意文本字段子串过滤（默认大小写不敏感）。
 * keyword 为空时返回原数组引用。
 */
export function filterByTextKeyword<T>(
  items: readonly T[],
  keyword: string | null | undefined,
  getText: (item: T) => string,
  caseSensitive = false,
): readonly T[] {
  const raw = String(keyword ?? '').trim()
  if (!raw) return items
  const needle = caseSensitive ? raw : raw.toLowerCase()
  return items.filter((item) => {
    const text = String(getText(item) ?? '')
    const hay = caseSensitive ? text : text.toLowerCase()
    return hay.includes(needle)
  })
}

/**
 * 按 label 子串过滤（默认大小写不敏感）。
 * keyword 为空时返回原数组引用，避免无谓复制。
 */
export function filterOptionsByLabelKeyword<T extends LabeledOption>(
  options: readonly T[],
  keyword: string | null | undefined,
  caseSensitive = false,
): readonly T[] {
  return filterByTextKeyword(options, keyword, (opt) => opt.label, caseSensitive)
}

/** 按 key 查找选项 */
export function findOptionByKey<T extends KeyedOption>(
  options: readonly T[],
  key: string | null | undefined,
): T | undefined {
  if (key == null || key === '') return undefined
  return options.find((opt) => opt.key === key)
}

/** 下拉是否有有效选中值（非 null / 非空串） */
export function hasDropdownValue(value: string | null | undefined): boolean {
  return value != null && value !== ''
}

/** PC dd-select 根 */
export function buildDropdownRootClassName(opts: {
  open?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dd-select'
  return cx(prefix, opts.open && 'is-open', opts.className)
}

/** PC 下拉面板 */
export function buildDropdownPanelClassName(opts: {
  align?: 'left' | 'right'
  className?: ClassValue
  prefix?: string
} = {}): string {
  const align = opts.align || 'left'
  const prefix = opts.prefix || 'dd-select__panel'
  return cx(prefix, `${prefix}--${align}`, opts.className)
}

/** PC 下拉项 */
export function buildDropdownItemClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'dd-select__item'
  return cx(prefix, opts.active && 'is-active', opts.className)
}

/** Taro ui-dropdown 根 */
export function buildUiDropdownClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-dropdown'
  return cx(prefix, opts.className)
}

/** Taro 触发器 */
export function buildUiDropdownTriggerClassName(opts: {
  placeholder?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-dropdown__trigger'
  return cx(prefix, opts.placeholder && `${prefix}--placeholder`, opts.className)
}

/** Taro 选项 */
export function buildUiDropdownOptionClassName(opts: {
  active?: boolean
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-dropdown__option'
  return cx(prefix, opts.active && `${prefix}--active`, opts.className)
}

