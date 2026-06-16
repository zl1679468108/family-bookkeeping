import React, { useState } from 'react'
import './index.scss'

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
  icon_type: 'category' | 'book'
}

interface IconGridProps {
  options: IconGridOption[]
  value?: string
  onChange?: (value: string) => void
  /** 自定义图标列表（用户上传的） */
  customIcons?: CustomIconItem[]
  /** 上传回调，传入后自动触发文件选择 */
  onUpload?: (file: File, iconType: 'category' | 'book') => Promise<void>
  /** 删除自定义图标回调 */
  onDelete?: (iconId: string) => Promise<void>
  /** 图标类型：分类 or 账本 */
  iconType?: 'category' | 'book'
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
    input.accept = 'image/png,image/jpeg,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // 验证文件类型
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('仅支持 PNG/JPG/WebP 格式')
        return
      }

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过 5MB')
        return
      }

      setUploading(true)
      try {
        await onUpload(file, iconType)
      } catch (error) {
        console.error('上传失败:', error)
        alert('上传失败，请重试')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  // 删除处理
  const handleDelete = async (e: React.MouseEvent, iconId: string) => {
    e.stopPropagation() // 阻止触发选择
    if (!onDelete) return

    if (!window.confirm('确定删除该图标吗？')) return

    setDeletingId(iconId)
    try {
      await onDelete(iconId)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
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
                      ×
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
                <span className="icon-btn-emoji">{uploading ? '⏳' : '➕'}</span>
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
