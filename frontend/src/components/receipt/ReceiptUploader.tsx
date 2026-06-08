import React, { useRef, useState } from 'react';
import { compressImage } from '../../utils/imageCompress';
import { useReceipt } from '../../hooks/useReceipt';
import { ConfirmDialog } from '../ConfirmDialog';
import { notify } from '../../utils/notifications';

interface ReceiptUploaderProps {
  /** 交易记录 ID（已存在的记录） */
  transactionId?: number;
  /** 已有的收据图片 URL */
  existingImageUrl?: string;
  /** 收据变更回调 */
  onChange?: (imageUrl: string | null) => void;
}

/**
 * 收据上传组件
 * 支持拍照/相册上传、压缩、替换和删除
 */
export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  transactionId,
  existingImageUrl,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Always call the hook (React rules) — use 0 as fallback for new transactions
  const { upload, remove, isUploading, isDeleting } = useReceipt(transactionId || 0);

  const currentImageUrl = previewUrl || existingImageUrl || null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 压缩图片
      const compressed = await compressImage(file, 1200, 0.7);

      // 生成本地预览
      const localUrl = URL.createObjectURL(compressed);
      setPreviewUrl(localUrl);

      // 如果有 transactionId，直接上传
      if (transactionId) {
        upload.mutate(compressed, {
          onSuccess: (data) => {
            onChange?.(data.image_url);
            // 清理本地预览
            URL.revokeObjectURL(localUrl);
            setPreviewUrl(null);
            notify({ type: 'success', message: '相册上传成功' });
          },
          onError: () => {
            URL.revokeObjectURL(localUrl);
            setPreviewUrl(null);
            notify({ type: 'error', message: '相册上传失败，请重试' });
          },
        });
      } else {
        // 新建模式，仅通知父组件
        onChange?.(localUrl);
      }
    } catch (err) {
      notify({ type: 'error', message: '图片处理失败' });
    }

    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  const handleDelete = () => {
    if (transactionId) {
      remove.mutate(undefined, {
        onSuccess: () => {
          onChange?.(null);
          setPreviewUrl(null);
          notify({ type: 'success', message: '相册已删除' });
        },
      });
    } else {
      onChange?.(null);
      setPreviewUrl(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    setShowDeleteConfirm(false);
  };

  // 有收据时显示缩略图 + 操作按钮
  if (currentImageUrl) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--fg)',
            marginBottom: '8px',
          }}
        >
          📎 相册
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={currentImageUrl}
            alt="相册"
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--fg)',
                cursor: 'pointer',
              }}
            >
              替换
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid oklch(60% 0.18 25 / 30%)',
                background: 'transparent',
                color: 'var(--danger)',
                cursor: 'pointer',
              }}
            >
              删除
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* 删除确认 */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="确认删除"
          message="确定要删除这张相册图片吗？删除后不可恢复。"
          confirmText="确认删除"
          confirmDanger={true}
          loading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    );
  }

  // 无收据时显示上传按钮
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--fg)',
          marginBottom: '8px',
        }}
      >
        📎 相册（可选）
      </label>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '10px 16px',
          fontSize: '14px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--fg)',
          cursor: 'pointer',
        }}
      >
        📷 相册
      </button>

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Uploading indicator */}
      {isUploading && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          相册上传中...
        </div>
      )}
    </div>
  );
};

export default ReceiptUploader;
