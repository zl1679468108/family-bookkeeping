/** 图片/文件上传限制与提示（对齐后端 FileValidationPipe） */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const IMAGE_ACCEPT_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

/** input.accept 精确类型 */
export const IMAGE_ACCEPT_ATTR = 'image/png,image/jpeg,image/webp'

/** 通用相册选择 */
export const IMAGE_ACCEPT_WILDCARD = 'image/*'

export const UPLOAD_SIZE_LIMIT = '文件大小不能超过 5MB'
export const UPLOAD_IMAGE_SIZE_LIMIT = '图片大小不能超过 5MB'
export const UPLOAD_FORMAT_LIMIT = '仅支持 PNG/JPG/WebP 格式'
export const UPLOAD_FAILED_RETRY = '上传失败，请重试'
export const UPLOAD_FAILED = '上传失败'
export const UPLOAD_ICON_FAILED = '图标上传失败'
export const UPLOAD_ICON_PARSE_FAILED = '图标上传解析失败'
export const DELETE_FAILED_RETRY = '删除失败，请重试'
export const DELETE_FAILED = '删除失败'
export const DELETE_THIS_IMAGE = '删除此图'
export const IMAGE_PROCESS_FAILED = '图片处理失败'
export const IMAGE_COMPRESS_FAILED = '图片压缩失败'
export const IMAGE_LOAD_FAILED = '图片加载失败'
export const IMAGE_SELECT_FAILED = '选择图片失败'
export const IMAGE_SELECT_FAILED_SHORT = '选择失败'
export const IMAGE_FILE_REQUIRED = '请选择图片文件'

/** 记一笔附件上限（与 useTransactionForm 一致） */
export const MAX_RECEIPT_IMAGES = 10

export function isAllowedImageMime(type?: string | null): boolean {
  if (!type) return false
  return (IMAGE_ACCEPT_MIME as readonly string[]).includes(type)
}

export function isWithinUploadSize(size: number, maxBytes = MAX_UPLOAD_BYTES): boolean {
  return size <= maxBytes
}

export function maxImagesMessage(max: number): string {
  return `最多只能上传 ${max} 张图片`
}

/** 微信隐私授权说明（相册） */
export const PRIVACY_ALBUM_FOR_ICON = '选择图标需要访问您的相册'
export const PRIVACY_ALBUM_FOR_AVATAR = '选择头像需要访问您的相册'
export const PRIVACY_ALBUM_FOR_IMAGE = '选择图片需要访问您的相册'


export const LABEL_PENDING_UPLOAD = '待上传'

/** 附件 n（alt，1-based index） */
export function attachmentImageAlt(index: number): string {
  return `附件 ${Number(index) || 0}`
}

/** 待上传 n（alt，1-based index） */
export function pendingUploadImageAlt(index: number): string {
  return `待上传 ${Number(index) || 0}`
}

/** 待上传 n 张 */
export function pendingUploadCountLabel(count: number): string {
  return `待上传 ${Number(count) || 0} 张`
}

/** 简短上限：最多上传 n 张（toast） */
export function maxUploadCountShort(max: number): string {
  return `最多上传 ${Number(max) || 0} 张`
}
