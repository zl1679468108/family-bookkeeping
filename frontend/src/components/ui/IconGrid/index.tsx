import React, { useState } from 'react'
import { Icon } from '../Icon'

import { notifyError } from '../../../utils/notifyError'
import {
  IMAGE_ACCEPT_ATTR,
  isAllowedImageMime,
  isWithinUploadSize,
  UPLOAD_FORMAT_LIMIT,
  UPLOAD_SIZE_LIMIT,
  UPLOAD_FAILED_RETRY,
  DELETE_FAILED_RETRY,
} from '../../../utils/uploadCopy'

/**
 * 通用图标网格选择器
 *
 * 支持预设图标（emoji/SVG）和自定义上传图标（图片 URL）
 * 分区域显示：预设图标区 + 自定义图标区（含 + 号上传按钮）
 *
 * 用法：
 *  <IconGrid
 *    options={[{ value: 'book', icon: '📖', label: '账本' }]}
 *    value={selectedValue}
 *    onChange={setSelectedValue}
 *    customIcons={[{ id: '1', icon_url: 'https://...', icon_type: 'category' }]}
 *    onUpload={async (file, iconType) => { ... }}
 *    onDelete={async (iconId) => { ... }}
 *    iconType="category"
 *  />
 */
export interface IconGridOption {
  value: string
  icon: React.ReactNode
  label?: string
  isImage?: boolean // 标记是否是图片图标（用 img 标签渲染）
}

export interface CustomIconItem {
  id: string
  icon_url: string
  icon_type: 'category' | 'book' | 'avatar'
}

interface IconGridProps {
  options: IconGridOption[]
  value?: string
  onChange?: (value: string) => void
  /** 自定义图标列表（用户上传的） */
  customIcons?: CustomIconItem[]
  /** 上传回调，传入后自动触发文件选择 */
  onUpload?: (file: File, iconType: 'category' | 'book' | 'avatar') => Promise<void>
  /** 删除自定义图标回调 */
  onDelete?: (iconId: string) => Promise<void>
  /** 图标类型：分类 / 账本 / 头像 */
  iconType?: 'category' | 'book' | 'avatar'
  columns?: number
  className?: string
}

export const IconGrid: React.FC<IconGridProps> = ({
  options,
  value,
  onChange,
  customIcons = [],
  onUpload,
  onDelete,
  iconType = 'category',
  columns = 5,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 上传处理
  const handleUploadClick = () => {
    if (!onUpload) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = IMAGE_ACCEPT_ATTR
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // 验证文件类型
      if (!isAllowedImageMime(file.type)) {
        notifyError(UPLOAD_FORMAT_LIMIT)
        return
      }

      // 验证文件大小 (5MB)
      if (!isWithinUploadSize(file.size)) {
        notifyError(UPLOAD_SIZE_LIMIT)
        return
      }

      setUploading(true)
      try {
        await onUpload(file, iconType)
      } catch (error) {
        notifyError(UPLOAD_FAILED_RETRY)
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  // 删除处理
  const handleDelete = async (e: React.MouseEvent, iconId: string) => {
    e.stopPropagation()
    if (!onDelete) return

    setDeletingId(iconId)
    try {
      await onDelete(iconId)
    } catch (error) {
      notifyError(DELETE_FAILED_RETRY)
    } finally {
      setDeletingId(null)
    }
  }

  const hasCustomSection = onUpload || customIcons.length > 0

  return (
    <div className={`icon-grid-wrapper ${className}`.trim()}>
      {/* 预设图标区 */}
      <div
        className="icon-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              className={`icon-btn ${active ? 'active' : ''}`}
              onClick={() => onChange?.(opt.value)}
            >
              {opt.isImage ? (
                <img
                  src={opt.icon as string}
                  alt={opt.label || ''}
                  className="icon-btn-image"
                />
              ) : (
                <span className="icon-btn-emoji">{opt.icon}</span>
              )}
              {opt.label && <span className="icon-btn-label">{opt.label}</span>}
            </button>
          )
        })}
      </div>

      {/* 自定义图标区 */}
      {hasCustomSection && (
        <>
          <div className="icon-grid-section-title">自定义图标</div>
          <div
            className="icon-grid"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {customIcons.map((ci) => {
              const active = ci.id === value || ci.icon_url === value
              return (
                <button
                  key={ci.id}
                  type="button"
                  className={`icon-btn ${active ? 'active' : ''}`}
                  onClick={() => onChange?.(ci.id)}
                >
                  <img
                    src={ci.icon_url}
                    alt="自定义图标"
                    className="icon-btn-image"
                  />
                  {/* 删除按钮 */}
                  {onDelete && (
                    <span
                      className={`icon-btn-delete ${deletingId === ci.id ? 'icon-btn-delete--loading' : ''}`}
                      onClick={(e) => handleDelete(e, ci.id)}
                    >
                      {deletingId === ci.id ? '…' : <Icon name="close" size={10} />}
                    </span>
                  )}
                </button>
              )
            })}
            {/* + 号上传按钮 */}
            {onUpload && (
              <button
                type="button"
                className="icon-btn icon-btn-upload"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <span className="icon-btn-emoji" aria-hidden>
                  {uploading ? (
                    <span className="icon-btn-spinner" />
                  ) : (
                    <Icon name="add" size={18} />
                  )}
                </span>
                <span className="icon-btn-label">{uploading ? '上传中' : '上传'}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default IconGrid
