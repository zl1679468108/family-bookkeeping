/**
 * 日期工具 — PC / Taro 对齐
 * 后端返回北京时间字符串 YYYY-MM-DD[ HH:mm:ss.SSS]
 */
export function parseDateInput(input: string | Date): Date {
  if (input instanceof Date) return input
  // 兼容 "YYYY-MM-DD HH:mm:ss" / ISO
  const normalized = input.includes('T') ? input : input.replace(' ', 'T')
  const d = new Date(normalized)
  return d
}

/** YYYY-MM-DD（取本地日历字段） */
export function formatDateYMD(input: string | Date): string {
  const date = parseDateInput(input)
  if (Number.isNaN(date.getTime())) {
    return typeof input === 'string' ? input : ''
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 友好日期：今天 / 昨天 / M月D日（同年） / YYYY-MM-DD（跨年）
 */
export function formatFriendlyDate(input: string | Date): string {
  const date = parseDateInput(input)
  if (Number.isNaN(date.getTime())) {
    return typeof input === 'string' ? input : ''
  }
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (day.getTime() === today.getTime()) return '今天'
  if (day.getTime() === yesterday.getTime()) return '昨天'
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  return formatDateYMD(date)
}

/** 今天（北京时间 YYYY-MM-DD） */
export function todayBeijing(): string {
  const now = new Date()
  const beijing = new Date(
    now.getTime() + now.getTimezoneOffset() * 60000 + 8 * 3600000,
  )
  return formatDateYMD(beijing)
}

/**
 * 兼容旧 API：formatDate(str, mode)
 * - full: YYYY-MM-DD
 * - dashboard: 友好日期
 */
export function formatDate(dateStr: string, mode: 'full' | 'dashboard' = 'full'): string {
  if (mode === 'dashboard') return formatFriendlyDate(dateStr)
  return formatDateYMD(dateStr)
}
