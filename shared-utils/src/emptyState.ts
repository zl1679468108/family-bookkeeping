/** EmptyState 纯逻辑 — 文案合并 / 插画尺寸 */

export type EmptyStateVariant = 'default' | 'compact' | 'full'

/**
 * 单段空态文案：
 * - 仅 description / 仅 title → 取有值者
 * - 两者皆有且为不同字符串 → `title。description`
 * - 两者皆有但非字符串 → 优先 description
 */
export function resolveEmptyStateText<T>(
  description?: T | null,
  title?: T | null,
): T | string | null | undefined {
  if (description != null && title != null && description !== title) {
    if (typeof description === 'string' && typeof title === 'string') {
      return `${title}。${description}`
    }
    return description
  }
  return description ?? title ?? null
}

/** Web 默认插画尺寸（px） */
export const EMPTY_ICON_SIZE_WEB: Record<EmptyStateVariant, number> = {
  compact: 100,
  default: 150,
  full: 180,
}

/** Taro 默认插画尺寸（rpx）——比 Web 视觉略紧，避免卡片内空态过大 */
export const EMPTY_ICON_SIZE_TARO: Record<EmptyStateVariant, number> = {
  compact: 160,
  default: 220,
  full: 280,
}

export function resolveEmptyIconSize(
  variant: EmptyStateVariant = 'default',
  platform: 'web' | 'taro' = 'web',
  explicit?: number,
): number {
  if (explicit != null) return explicit
  const map = platform === 'taro' ? EMPTY_ICON_SIZE_TARO : EMPTY_ICON_SIZE_WEB
  return map[variant] ?? map.default
}

/** empty-state / empty-state--compact */
export function buildEmptyStateClassName(
  variant: EmptyStateVariant = 'default',
  className: string = '',
  prefix = 'empty-state',
): string {
  const extra = (className || '').trim()
  return [prefix, `${prefix}--${variant}`, extra].filter(Boolean).join(' ')
}

