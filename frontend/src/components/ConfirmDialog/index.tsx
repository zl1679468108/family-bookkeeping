import React, { useEffect } from 'react'
import './index.scss'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmDanger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
  closable?: boolean
}

/**
 * 通用确认弹窗
 * 项目所有删除/危险操作的二次确认统一使用此组件
 *
 * @example
 * <ConfirmDialog
 *   open={!!deleteTarget}
 *   title="确认删除"
 *   message="确定要删除这本书吗？删除后不可恢复。"
 *   onConfirm={handleDelete}
 *   onCancel={() => setDeleteTarget(null)}
 *   loading={mutation.isPending}
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = '确认删除',
  cancelText = '取消',
  confirmDanger = true,
  loading = false,
  onConfirm,
  onCancel,
  children,
  closable = true,
}) => {
  // ESC 键关闭弹窗
  useEffect(() => {
    if (!open || !closable) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, closable, onCancel])

  if (!open) return null

  const confirmVariant = confirmDanger ? 'danger' : 'primary'

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>

        {children && <div className="confirm-dialog__children">{children}</div>}

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__btn confirm-dialog__btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`confirm-dialog__btn confirm-dialog__btn--confirm ${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <svg
                className="confirm-dialog__spinner"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
