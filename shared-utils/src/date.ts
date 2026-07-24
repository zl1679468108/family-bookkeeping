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

/** 按 Asia/Shanghai 输出 YYYY-MM-DD（与 toLocaleDateString en-CA 一致） */
export function formatBeijingYMD(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
}

/** 今天（北京时间 YYYY-MM-DD） */
export function todayBeijing(): string {
  // 优先用时区 API，避免与周期模板 nextDate 口径漂移
  try {
    return formatBeijingYMD()
  } catch {
    const now = new Date()
    const beijing = new Date(
      now.getTime() + now.getTimezoneOffset() * 60000 + 8 * 3600000,
    )
    return formatDateYMD(beijing)
  }
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

/** 日期时间展示（本地/浏览器；用于管理端等非业务流水时间） */
export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '-'
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return String(input)
  return d.toLocaleString('zh-CN')
}

/** 精确到分钟：YYYY-MM-DD HH:mm（详情弹窗创建/更新时间） */
export function formatDateTimeMinute(input: string | Date | null | undefined): string {
  if (!input) return '-'
  if (typeof input === 'string') {
    const m = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
    if (m) return `${m[1]} ${m[2]}`
  }
  const d = input instanceof Date ? input : parseDateInput(String(input))
  if (Number.isNaN(d.getTime())) return String(input)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day} ${h}:${mi}`
}

/** 兼容 Taro 旧名 */
export const fmtDate = (d: Date): string => formatDateYMD(d)
export const fmtFriendlyDate = (ds: string): string => formatFriendlyDate(ds)

