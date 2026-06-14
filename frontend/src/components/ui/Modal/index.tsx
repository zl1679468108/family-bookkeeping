import React from 'react'
import './index.scss'

/**
 * 通用弹窗容器 —— 统一 book-modal-overlay / book-modal-dialog 结构
 *
 * 用法：
 *  <Modal open={open} onClose={onClose} title="创建账本"
 *    footer={<ModalFooter onCancel={onClose} onConfirm={handleSubmit} />}>
 *    {content}
 *  </Modal>
 */
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  width?: string | number
  closable?: boolean
  closeOnMask?: boolean
  className?: string
  bodyClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width,
  size = 'md',
  closable = true,
  closeOnMask = true,
  className = '',
  bodyClassName = '',
}) => {
  if (!open) return null

  const defaultWidth = size === 'sm' ? 420 : size === 'lg' ? 720 : 520

  return (
    <div className="book-modal-overlay" onClick={() => closeOnMask && onClose()}>
      <div
        className={`book-modal-dialog ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : `${defaultWidth}px`,
          width: '100%',
        }}
      >
        {(title || closable) && (
          <div className="book-modal-dialog__header">
            <div className="book-modal-dialog__header-text">
              {title && <h3 className="book-modal-dialog__title">{title}</h3>}
              {description && <div className="book-modal-dialog__desc">{description}</div>}
            </div>
            {closable && (
              <button type="button" className="book-modal-dialog__close" onClick={onClose} aria-label="关闭">
                ✕
              </button>
            )}
          </div>
        )}

        {children && (
          <div className={`book-modal-dialog__body ${bodyClassName}`.trim()}>
            {children}
          </div>
        )}

        {footer && <div className="book-modal-dialog__footer">{footer}</div>}
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children?: React.ReactNode
  onCancel?: () => void
  onConfirm?: () => void
  cancelText?: string
  confirmText?: string
  confirmLoading?: boolean
  confirmDanger?: boolean
  confirmDisabled?: boolean
  confirmVariant?: 'primary' | 'danger'
}

/**
 * 统一的弹窗底部按钮栏
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  onCancel,
  onConfirm,
  cancelText = '取消',
  confirmText = '确定',
  confirmLoading = false,
  confirmDanger = false,
  confirmDisabled = false,
  confirmVariant = 'primary',
}) => {
  if (children) return <>{children}</>
  const btnVariant = confirmDanger ? 'danger' : confirmVariant

  return (
    <div className="book-modal-dialog__footer-inner">
      {onCancel && (
        <button
          type="button"
          className="book-modal-btn book-modal-btn--secondary"
          onClick={onCancel}
          disabled={confirmLoading}
        >
          {cancelText}
        </button>
      )}
      {onConfirm && (
        <button
          type="button"
          className={`book-modal-btn ${btnVariant === 'danger' ? 'book-modal-btn--danger' : 'book-modal-btn--primary'}`}
          onClick={onConfirm}
          disabled={confirmLoading || confirmDisabled}
        >
          {confirmLoading ? '处理中…' : confirmText}
        </button>
      )}
    </div>
  )
}

export default Modal
