import { ERROR_OP_FAILED } from './errorCopy'

/** 统一错误文案提取 */
export function getErrorMessage(err: unknown, fallback = ERROR_OP_FAILED): string {
  if (!err) return fallback
  if (typeof err === 'string' && err.trim()) return err
  const anyErr = err as { message?: string; errMsg?: string; error?: string; msg?: string }
  return anyErr?.message || anyErr?.errMsg || anyErr?.error || anyErr?.msg || fallback
}

export function formatErrorDescription(err: unknown, fallback = ERROR_OP_FAILED): string {
  const message = getErrorMessage(err, '')
  return message ? `${fallback}：${message}` : fallback
}
