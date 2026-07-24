/**
 * 附件上传结果聚合纯函数 — PC / Taro 记一笔共用
 */

export type UploadPendingResult = {
  uploadedUrls: string[]
  failedCount: number
}

export function emptyUploadPendingResult(): UploadPendingResult {
  return { uploadedUrls: [], failedCount: 0 }
}

/** loading 文案：上传图片 3/10... */
export function uploadImagesProgressTitle(done: number, total: number): string {
  const d = Math.max(0, Math.floor(done))
  const t = Math.max(0, Math.floor(total))
  return `上传图片 ${d}/${t}...`
}

/** 合并已有 URL 与新上传 URL（去空） */
export function mergeImageUrls(
  baseUrls: readonly string[] = [],
  newUrls: readonly (string | null | undefined)[] = [],
): string[] {
  const next = newUrls.filter((u): u is string => Boolean(u && String(u).trim()))
  if (next.length === 0) return baseUrls.slice()
  return [...baseUrls, ...next]
}

/**
 * 从接口结果列表统计成功 URL / 失败数
 * results 项可为 { image_url } 或直接 string
 */
export function summarizeUploadResults(
  results: readonly unknown[] = [],
): UploadPendingResult {
  const uploadedUrls: string[] = []
  let failedCount = 0
  for (const item of results) {
    if (typeof item === 'string' && item.trim()) {
      uploadedUrls.push(item)
      continue
    }
    if (item && typeof item === 'object' && 'image_url' in (item as object)) {
      const url = (item as { image_url?: unknown }).image_url
      if (typeof url === 'string' && url.trim()) {
        uploadedUrls.push(url)
        continue
      }
    }
    failedCount += 1
  }
  return { uploadedUrls, failedCount }
}
