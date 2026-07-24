/**
 * 表单校验（密码 / 邮箱）
 * 返回错误文案，通过时返回 null。文案尽量贴近既有产品提示，勿擅自加严规则。
 */

export function validatePasswordMinLength(
  password: string,
  options?: { min?: number; message?: string },
): string | null {
  const min = options?.min ?? 6
  if (!password || password.length < min) {
    return options?.message ?? `密码长度至少为 ${min} 位`
  }
  return null
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
  message = '两次密码不一致',
): string | null {
  if (password !== confirm) return message
  return null
}

/** 改密场景：大小写字母 + 数字 */
export function validatePasswordStrength(
  password: string,
  message = '新密码必须同时包含大小写字母和数字',
): string | null {
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return message
  return null
}

/** 重置链接场景：字母 + 数字（不强制大小写） */
export function validatePasswordAlphaNumeric(
  password: string,
  message = '密码必须包含字母和数字',
): string | null {
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) return message
  return null
}

export function validateEmail(
  email: string,
  options?: {
    required?: boolean
    emptyMessage?: string
    invalidMessage?: string
  },
): string | null {
  const required = options?.required ?? true
  const trimmed = email.trim()
  if (!trimmed) {
    return required ? (options?.emptyMessage ?? '邮箱不能为空') : null
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return options?.invalidMessage ?? '邮箱格式不正确'
  }
  return null
}
