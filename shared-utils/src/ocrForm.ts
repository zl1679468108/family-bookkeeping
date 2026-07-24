/**
 * OCR 识别结果 → 记一笔表单补丁（纯函数）
 */

export type OcrFormFields = {
  amount: string
  category: string
  type: 'expense' | 'income'
  date: string
  brand: string
  note: string
}

export type OcrResultLike = {
  amount?: string | number | null
  type?: 'expense' | 'income' | null
  date?: string | null
  note?: string | null
}

export function isOcrResultUseful(ocr: OcrResultLike | null | undefined): boolean {
  if (!ocr) return false
  const hasAmount = ocr.amount !== undefined && ocr.amount !== null && String(ocr.amount) !== ''
  const hasDate = !!ocr.date
  return hasAmount || hasDate
}

/** 将 OCR 结果合并进表单；类型变化时清空分类 */
export function applyOcrResultToForm<T extends OcrFormFields>(
  prev: T,
  ocr: OcrResultLike | null | undefined,
): T {
  if (!ocr) return prev
  const next = { ...prev }
  if (ocr.type && ocr.type !== prev.type) {
    next.type = ocr.type
    next.category = ''
  }
  if (ocr.amount !== undefined && ocr.amount !== null && String(ocr.amount) !== '') {
    next.amount = String(ocr.amount)
  }
  if (ocr.date) next.date = ocr.date
  if (ocr.note) next.note = ocr.note
  return next
}
