/** 图片/文件上传限制与提示 — 与 PC / 后端 FileValidationPipe 对齐 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_ACCEPT_MIME = ["image/png", "image/jpeg", "image/webp"] as const;

export const IMAGE_ACCEPT_ATTR = "image/png,image/jpeg,image/webp";

export const IMAGE_ACCEPT_WILDCARD = "image/*";

export const UPLOAD_SIZE_LIMIT = "文件大小不能超过 5MB";
export const UPLOAD_IMAGE_SIZE_LIMIT = "图片大小不能超过 5MB";
export const UPLOAD_FORMAT_LIMIT = "仅支持 PNG/JPG/WebP 格式";
export const UPLOAD_FAILED_RETRY = "上传失败，请重试";
export const UPLOAD_FAILED = "上传失败";
export const DELETE_FAILED_RETRY = "删除失败，请重试";
export const DELETE_FAILED = "删除失败";
export const IMAGE_PROCESS_FAILED = "图片处理失败";
export const IMAGE_SELECT_FAILED = "选择图片失败";
export const IMAGE_FILE_REQUIRED = "请选择图片文件";

export const MAX_RECEIPT_IMAGES = 10;

export function isAllowedImageMime(type?: string | null): boolean {
  if (!type) return false;
  return (IMAGE_ACCEPT_MIME as readonly string[]).includes(type);
}

export function isWithinUploadSize(size: number, maxBytes = MAX_UPLOAD_BYTES): boolean {
  return size <= maxBytes;
}

export function maxImagesMessage(max: number): string {
  return `最多只能上传 ${max} 张图片`;
}
