import React, { useEffect, useRef } from 'react';
import { useModalZIndex } from '../../hooks/useModalZIndex';
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { FooterActions } from '../ui/FooterActions'
import { Spinner } from '../ui/Spinner'
import { ACTION_CLOSE, ACTION_CANCEL, ACTION_CONFIRM } from '../../utils/actionCopy'
import {
  resolveGlobalModalWidth,
  buildGlobalModalOverlayClassName,
  buildGlobalModalDialogClassName,
  buildGlobalModalBtnClassName,
  buildGlobalModalBodyClassName,
} from '../../utils/globalModal'

export type GlobalModalType = 'confirm' | 'detail' | 'modal';

interface GlobalModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 弹窗类型 */
  type?: GlobalModalType;
  /** 标题 */
  title?: React.ReactNode;
  /** 描述（仅 modal 类型可用） */
  description?: React.ReactNode;
  /** 内容 */
  children?: React.ReactNode;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 宽度 */
  width?: string | number;
  /** 是否可关闭 */
  closable?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnMask?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 内容体类名 */
  bodyClassName?: string;
  /** 尺寸（仅 modal 类型可用） */
  size?: 'sm' | 'md' | 'lg';
  /** 确认对话框专用：确认按钮文字 */
  confirmText?: string;
  /** 确认对话框专用：取消按钮文字 */
  cancelText?: string;
  /** 确认对话框专用：确认按钮是否为危险样式 */
  confirmDanger?: boolean;
  /** 确认对话框专用：是否加载中 */
  loading?: boolean;
  /** 确认对话框专用：确认回调 */
  onConfirm?: () => void;
}

/** 收集 DOM 元素中可 focus 的元素 */
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      // 排除 disabled 按钮和不可见元素
      if ('disabled' in el && (el as HTMLButtonElement).disabled) return false;
      return el.offsetParent !== null;
    },
  );
}

export const GlobalModal: React.FC<GlobalModalProps> = ({
  open,
  onClose,
  type = 'modal',
  title,
  description,
  children,
  footer,
  width,
  closable = true,
  closeOnMask = true,
  className = '',
  bodyClassName = '',
  size = 'md',
  confirmText = ACTION_CONFIRM,
  cancelText = ACTION_CANCEL,
  confirmDanger = false,
  loading = false,
  onConfirm,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 根据类型确定基础 z-index
  const zIndexType = type === 'confirm' ? 'critical' : type === 'detail' ? 'detail' : 'modal';
  const zIndex = useModalZIndex(open, zIndexType);

  // T-M34: Focus trap + ARIA
  useEffect(() => {
    if (!open) return;

    // 记录当前焦点以便恢复
    previouslyFocused.current = document.activeElement as HTMLElement;

    // 自动聚焦到 dialog
    const dialogEl = dialogRef.current;
    if (dialogEl) {
      // 表单类弹窗优先聚焦第一个输入框，否则聚焦第一个可交互元素
      const focusable = getFocusableElements(dialogEl);
      const fieldEls = focusable.filter(
        (el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA',
      );
      const target = fieldEls[0] || focusable[0];
      if (target) {
        target.focus();
      } else {
        dialogEl.setAttribute('tabindex', '-1');
        dialogEl.focus();
      }
    }

    // ESC 键关闭弹窗
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      // T-M34: Focus trap — Tab/Shift+Tab 循环聚焦
      if (e.key === 'Tab' && dialogEl) {
        const focusable = getFocusableElements(dialogEl);
        if (focusable.length === 0) return;

        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: 从第一个元素回到最后一个
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab: 从最后一个元素回到第一个
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 恢复之前焦点
      if (previouslyFocused.current) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  // ESC 键关闭弹窗（保留原有行为作为兜底）
  useEffect(() => {
    if (!open || !closable) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closable]);

  if (!open) return null;

  const overlayClass = buildGlobalModalOverlayClassName({ type });
  const dialogClass = buildGlobalModalDialogClassName({ type, className });
  const defaultWidth = resolveGlobalModalWidth(type, size, width);

  // 渲染确认对话框模式
  if (type === 'confirm') {
    const confirmVariant = confirmDanger ? 'danger' : 'primary';
    return (
      <div className={overlayClass} onClick={onClose} style={{ zIndex }} role="presentation">
        <div
          ref={dialogRef}
          className={dialogClass}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={title ? `${type}-title` : undefined}
          aria-describedby={children ? `${type}-desc` : undefined}
        >
          {title && <h3 id={`${type}-title`} className="global-modal-dialog__title">{title}</h3>}
          {children && <div id={`${type}-desc`} className="global-modal-dialog__message">{children}</div>}
          <FooterActions align="stretch" className="global-modal-dialog__actions">
            <Button
              type="button"
              variant="secondary"
              className={buildGlobalModalBtnClassName({ role: 'cancel' })}
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={confirmVariant === 'danger' ? 'danger' : 'primary'}
              className={buildGlobalModalBtnClassName({ role: 'confirm', variant: confirmVariant })}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading && (
                <Spinner size={16} className="global-modal-dialog__spinner" />
              )}
              {confirmText}
            </Button>
          </FooterActions>
        </div>
      </div>
    );
  }

  // 渲染详情弹窗和通用弹窗模式
  return (
    <div className={overlayClass} onClick={() => closeOnMask && onClose()} style={{ zIndex }} role="presentation">
      <div
        ref={dialogRef}
        className={dialogClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${type}-title` : undefined}
        aria-describedby={description ? `${type}-desc` : undefined}
        style={{
          maxWidth: typeof defaultWidth === 'number' ? `${defaultWidth}px` : defaultWidth,
          width: '100%',
        }}
      >
        {(title || closable) && (
          <div className="global-modal-dialog__header">
            <div className="global-modal-dialog__header-text">
              {title && <h3 id={`${type}-title`} className="global-modal-dialog__title">{title}</h3>}
              {description && <div id={`${type}-desc`} className="global-modal-dialog__desc">{description}</div>}
            </div>
            {closable && (
              <button type="button" className="global-modal-dialog__close" onClick={onClose} aria-label={ACTION_CLOSE}>
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        )}

        {children && (
          <div className={buildGlobalModalBodyClassName({ className: bodyClassName })}>
            {children}
          </div>
        )}

        {footer && <div className="global-modal-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default GlobalModal;
