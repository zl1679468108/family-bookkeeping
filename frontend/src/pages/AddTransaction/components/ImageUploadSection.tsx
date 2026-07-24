import React from 'react'
import { MAX_IMAGES } from '../hooks/useTransactionForm'
import type { PendingImage } from '../hooks/useTransactionForm'
import { Button } from '../../../components/ui/Button'
import { Icon } from '../../../components/ui/Icon'
import { IMAGE_ACCEPT_WILDCARD, DELETE_THIS_IMAGE, attachmentImageAlt, pendingUploadImageAlt } from '../../../utils/uploadCopy'
import { ACTION_CLEAR, ACTION_ADD_IMAGE } from '../../../utils/actionCopy'
import {
  buildImageUploadSectionClassName,
  buildImageGridClassName,
  buildImageItemClassName,
  buildImageAddClassName,
} from '../../../utils/imageUpload'
import { fieldAttachmentCapacity } from '../../../utils/fieldCopy'

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
    <div className={buildImageUploadSectionClassName()}>
      <div className="upload-header">
        <span className="upload-title">
          {fieldAttachmentCapacity(allImageUrls.length, MAX_IMAGES)}
        </span>
        {allImageUrls.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="link-btn" onClick={onClearAll}>{ACTION_CLEAR}</Button>
        )}
      </div>

      <div className={buildImageGridClassName()}>
        {savedImageUrls.map((url, idx) => (
          <div key={`saved-${idx}`} className={buildImageItemClassName()}>
            <img src={url} alt={attachmentImageAlt(idx + 1)} />
            <button type="button" className="image-remove" onClick={() => onRemoveSaved(idx)} title={DELETE_THIS_IMAGE} aria-label={DELETE_THIS_IMAGE}><Icon name="close" size={12} /></button>
          </div>
        ))}
        {pendingImages.map((p, idx) => (
          <div key={`pending-${idx}`} className={buildImageItemClassName()}>
            <img src={p.localUrl} alt={pendingUploadImageAlt(idx + 1)} />
            <button type="button" className="image-remove" onClick={() => onRemovePending(idx)} title={DELETE_THIS_IMAGE} aria-label={DELETE_THIS_IMAGE}><Icon name="close" size={12} /></button>
          </div>
        ))}
        {canAddMore && (
          <div className={buildImageAddClassName()} onClick={() => fileInputRef.current?.click()}>
            <span className="image-add-icon">+</span>
            <span className="image-add-text">{ACTION_ADD_IMAGE}</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT_WILDCARD}
        multiple
        capture="environment"
        style={{ display: 'none' }}
        onChange={onFileSelect}
      />
    </div>
  )
}
