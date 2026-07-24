import { notify } from './notifications'
import { getErrorMessage } from './errorMessage'

/** 统一错误通知（PC） */
export function notifyError(err: unknown, fallback = '操作失败'): void {
  notify({ type: 'error', message: getErrorMessage(err, fallback) })
}

/** 统一成功通知 */
export function notifySuccess(message: string): void {
  notify({ type: 'success', message })
}
