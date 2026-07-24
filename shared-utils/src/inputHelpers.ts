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
