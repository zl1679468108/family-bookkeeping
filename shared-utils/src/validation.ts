/**
 * 表单校验（密码 / 邮箱）
 * 返回错误文案，通过时返回 null。文案尽量贴近既有产品提示，勿擅自加严规则。
 */

import {
  FORM_PASSWORD_MIN,
  FORM_PASSWORD_MISMATCH,
  FORM_PASSWORD_STRENGTH,
  FORM_PASSWORD_ALPHA_NUMERIC,
  FORM_EMAIL_EMPTY,
  FORM_EMAIL_INVALID,
  FORM_INVITE_CODE_REQUIRED,
  FORM_INVITE_CODE_MIN,
  FORM_AMOUNT_INVALID,
  FORM_CATEGORY_REQUIRED,
} from './formCopy'
import { isValidPositiveAmount } from './budget'

export function validatePasswordMinLength(
  password: string,
  options?: { min?: number; message?: string },
): string | null {
  const min = options?.min ?? 6
  if (!password || password.length < min) {
    return options?.message ?? FORM_PASSWORD_MIN(min)
  }
  return null
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
  message = FORM_PASSWORD_MISMATCH,
): string | null {
  if (password !== confirm) return message
  return null
}

/** 改密场景：大小写字母 + 数字 */
export function validatePasswordStrength(
  password: string,
  message = FORM_PASSWORD_STRENGTH,
): string | null {
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return message
  return null
}

/** 重置链接场景：字母 + 数字（不强制大小写） */
export function validatePasswordAlphaNumeric(
  password: string,
  message = FORM_PASSWORD_ALPHA_NUMERIC,
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
    return required ? (options?.emptyMessage ?? FORM_EMAIL_EMPTY) : null
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return options?.invalidMessage ?? FORM_EMAIL_INVALID
  }
  return null
}

/** 邀请码：trim + 大写（加入账本提交口径） */
export function normalizeInviteCode(code: string): string {
  return String(code ?? '').trim().toUpperCase()
}

/** 邀请码：去空白后至少 min 位（默认 4） */
export function validateInviteCode(
  code: string,
  options?: { min?: number; requiredMessage?: string; minMessage?: string },
): string | null {
  const min = options?.min ?? 4
  const trimmed = String(code ?? '').trim()
  if (!trimmed) return options?.requiredMessage ?? FORM_INVITE_CODE_REQUIRED
  if (trimmed.length < min) return options?.minMessage ?? FORM_INVITE_CODE_MIN
  return null
}

export type TransactionFormFieldError = {
  ok: false
  field: 'amount' | 'category'
  message: string
}

export type TransactionFormFieldOk = { ok: true }

/** 记一笔金额 + 分类必填校验（文案与 formCopy 对齐） */
export function validateTransactionFormFields(input: {
  amount: string | number
  categoryId?: string | number | null
}): TransactionFormFieldOk | TransactionFormFieldError {
  if (!isValidPositiveAmount(input.amount)) {
    return { ok: false, field: 'amount', message: FORM_AMOUNT_INVALID }
  }
  if (input.categoryId === null || input.categoryId === undefined || input.categoryId === '') {
    return { ok: false, field: 'category', message: FORM_CATEGORY_REQUIRED }
  }
  return { ok: true }
}
