/** 输入框纯逻辑 — 双端 Input / SearchInput 共用 */

/** 是否展示清除按钮 */
export function shouldShowInputClear(
  allowClear: boolean | undefined,
  value: unknown,
  disabled?: boolean,
): boolean {
  if (!allowClear || disabled) return false
  if (value == null) return false
  return String(value).length > 0
}

/** password 可见切换后的实际 type */
export function resolvePasswordInputType(
  baseType: string | undefined,
  showPasswordToggle: boolean | undefined,
  showPassword: boolean,
): string | undefined {
  if (showPasswordToggle && baseType === 'password') {
    return showPassword ? 'text' : 'password'
  }
  return baseType
}

/** 字数统计展示：`12 / 500` */
export function formatCharCount(current: number, max: number): string {
  return `${Number(current) || 0} / ${max}`
}

/** 字数统计紧凑：`12/500`（无空格） */
export function formatCharCountCompact(current: number, max: number): string {
  return `${Number(current) || 0}/${max}`
}

