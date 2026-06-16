import React, { useEffect, useRef } from 'react';
import './index.scss';

export interface DrawerHandle {
  close: () => void;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** 抽屉宽度，默认 420px */
  width?: number | string;
  /** 抽屉位置：right 或 left，默认 right */
  placement?: 'right' | 'left';
  /** 是否显示遮罩层，默认 true */
  mask?: boolean;
  /** 点击遮罩层是否关闭，默认 true */
  maskClosable?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  children,
  width = 420,
  placement = 'right',
  mask = true,
  maskClosable = true,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // 禁止 body 滚动
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handleMaskClick = (e: React.MouseEvent) => {
    if (!maskClosable) return;
    if (e.target === e.currentTarget) onClose();
  };

  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <div
      className={`ui-drawer-root ${open ? 'is-open' : ''} ${placement === 'left' ? 'ui-drawer--left' : ''}`}
      ref={drawerRef}
    >
      {mask && <div className="ui-drawer-mask" onClick={handleMaskClick} />}
      <div className="ui-drawer-panel" style={{ width: widthStyle }} role="dialog" aria-modal="true">
        {(title || maskClosable) && (
          <div className="ui-drawer-header">
            {title && <div className="ui-drawer-title">{title}</div>}
            <button
              type="button"
              className="ui-drawer-close"
              onClick={onClose}
              aria-label="关闭"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="ui-drawer-body">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
