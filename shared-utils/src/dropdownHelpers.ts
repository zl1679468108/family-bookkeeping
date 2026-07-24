/**
 * Dropdown / DropdownSelect 纯逻辑
 * 过滤、选中查找、是否有值
 */

export type LabeledOption = { label: string }
export type KeyedOption = { key: string }

/**
 * 按 label 子串过滤（默认大小写不敏感）。
 * keyword 为空时返回原数组引用，避免无谓复制。
 */
export function filterOptionsByLabelKeyword<T extends LabeledOption>(
  options: readonly T[],
  keyword: string | null | undefined,
  caseSensitive = false,
): readonly T[] {
  const raw = String(keyword ?? '').trim()
  if (!raw) return options
  const needle = caseSensitive ? raw : raw.toLowerCase()
  return options.filter((opt) => {
    const label = String(opt.label ?? '')
    const hay = caseSensitive ? label : label.toLowerCase()
    return hay.includes(needle)
  })
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
