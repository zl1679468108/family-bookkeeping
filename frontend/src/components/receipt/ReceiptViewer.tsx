import React from 'react';

interface ReceiptViewerProps {
  /** 收据图片 URL */
  imageUrl: string | null;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 收据全屏查看器
 * 点击背景或关闭按钮关闭
 */
export const ReceiptViewer: React.FC<ReceiptViewerProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
        aria-label="关闭"
      >
        ✕
      </button>

      {/* 图片 */}
      <img
        src={imageUrl}
        alt="收据"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          padding: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ReceiptViewer;
