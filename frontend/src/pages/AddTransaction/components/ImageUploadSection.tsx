import React from 'react'
import { MAX_IMAGES } from '../hooks/useTransactionForm'
import type { PendingImage } from '../hooks/useTransactionForm'
import { Button } from '../../../components/ui/Button'

interface ImageUploadSectionProps {
  savedImageUrls: string[]
  pendingImages: PendingImage[]
  allImageUrls: string[]
  canAddMore: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveSaved: (idx: number) => void
  onRemovePending: (idx: number) => void
  onClearAll: () => void
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  savedImageUrls, pendingImages, allImageUrls, canAddMore,
  fileInputRef, onFileSelect, onRemoveSaved, onRemovePending, onClearAll,
}) => {
  return (
    <div className="upload-section">
      <div className="upload-header">
        <span className="upload-title">
          附件 ({allImageUrls.length} / {MAX_IMAGES})
        </span>
        {allImageUrls.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="link-btn" onClick={onClearAll}>清空</Button>
        )}
      </div>

      <div className="image-grid">
        {savedImageUrls.map((url, idx) => (
          <div key={`saved-${idx}`} className="image-item">
            <img src={url} alt={`附件 ${idx + 1}`} />
            <button type="button" className="image-remove" onClick={() => onRemoveSaved(idx)} title="删除此图" aria-label="删除此图">×</button>
          </div>
        ))}
        {pendingImages.map((p, idx) => (
          <div key={`pending-${idx}`} className="image-item">
            <img src={p.localUrl} alt={`待上传 ${idx + 1}`} />
            <button type="button" className="image-remove" onClick={() => onRemovePending(idx)} title="删除此图" aria-label="删除此图">×</button>
          </div>
        ))}
        {canAddMore && (
          <div className="image-add" onClick={() => fileInputRef.current?.click()}>
            <span className="image-add-icon">+</span>
            <span className="image-add-text">添加图片</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        style={{ display: 'none' }}
        onChange={onFileSelect}
      />
    </div>
  )
}
