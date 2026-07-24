/**
 * GlobalModal class / 默认宽度 — PC / Taro 共用语义
 */

import { cx, type ClassValue } from './cx'

export type GlobalModalType = 'confirm' | 'detail' | 'modal'
export type GlobalModalSize = 'sm' | 'md' | 'lg'

/** PC 弹层默认宽度（px） */
export function resolveGlobalModalWidth(
  type: GlobalModalType,
  size: GlobalModalSize = 'md',
  explicit?: string | number,
): string | number {
  if (explicit !== undefined) return explicit
  if (type === 'confirm') return 380
  if (size === 'sm') return 420
  if (size === 'lg') return 720
  return 520
}

/** PC 遮罩 */
export function buildGlobalModalOverlayClassName(opts: {
  type?: GlobalModalType
  className?: ClassValue
  prefix?: string
} = {}): string {
  const type = opts.type || 'modal'
  const prefix = opts.prefix || 'global-modal-overlay'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}

/** PC 对话框 */
export function buildGlobalModalDialogClassName(opts: {
  type?: GlobalModalType
  className?: ClassValue
  prefix?: string
} = {}): string {
  const type = opts.type || 'modal'
  const prefix = opts.prefix || 'global-modal-dialog'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}

/** PC 确认/取消按钮 */
export function buildGlobalModalBtnClassName(opts: {
  role?: 'cancel' | 'confirm'
  variant?: 'primary' | 'danger' | string
  className?: ClassValue
  prefix?: string
} = {}): string {
  const role = opts.role || 'confirm'
  const prefix = opts.prefix || 'global-modal-btn'
  return cx(
    prefix,
    `${prefix}--${role}`,
    role === 'confirm' && opts.variant,
    opts.className,
  )
}

/** PC body */
export function buildGlobalModalBodyClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'global-modal-dialog__body'
  return cx(prefix, opts.className)
}

/** Taro ui-modal 根 */
export function buildUiModalClassName(opts: {
  type?: GlobalModalType
  className?: ClassValue
  prefix?: string
} = {}): string {
  const type = opts.type || 'modal'
  const prefix = opts.prefix || 'ui-modal'
  return cx(prefix, `${prefix}--${type}`, opts.className)
}

/** Taro dialog */
export function buildUiModalDialogClassName(opts: {
  layout?: 'center' | 'sheet'
  size?: GlobalModalSize
  className?: ClassValue
  prefix?: string
} = {}): string {
  const layout = opts.layout || 'sheet'
  const size = opts.size || 'md'
  const prefix = opts.prefix || 'ui-modal__dialog'
  return cx(prefix, `${prefix}--${layout}`, `${prefix}--${size}`, opts.className)
}

/** Taro body */
export function buildUiModalBodyClassName(opts: {
  className?: ClassValue
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-modal__body'
  return cx(prefix, opts.className)
}
