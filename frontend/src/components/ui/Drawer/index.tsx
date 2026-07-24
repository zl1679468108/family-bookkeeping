import React, { useEffect, useRef } from 'react';
import { Icon } from '../Icon';
import { ACTION_CLOSE } from '../../../utils/actionCopy'
import { DRAWER_DEFAULT_WIDTH_PX, DRAWER_DEFAULT_PLACEMENT, buildDrawerRootClassName } from '../../../utils/drawer'

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
  width = DRAWER_DEFAULT_WIDTH_PX,
  placement = DRAWER_DEFAULT_PLACEMENT,
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
      className={buildDrawerRootClassName({ open, placement })}
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
              aria-label={ACTION_CLOSE}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
        <div className="ui-drawer-body">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
