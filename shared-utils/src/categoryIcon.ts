/**
 * 分类/账本图标类型判定 — 双端 renderCategoryIcon 决策树共用
 * 端侧仅负责 React / Taro 渲染
 */

import { isIconUrl, isPlatformIcon } from './platformIcons'
import { isBookIconKey } from './bookIcons'

export type CategoryIconKind = 'empty' | 'url' | 'platform' | 'book' | 'text'

export function resolveCategoryIconKind(icon?: string | null): CategoryIconKind {
  if (!icon) return 'empty'
  if (isIconUrl(icon)) return 'url'
  if (isPlatformIcon(icon)) return 'platform'
  if (isBookIconKey(icon)) return 'book'
  return 'text'
}

/** platform_xxx → xxx */
export function platformIconKey(icon: string): string {
  return String(icon || '').replace(/^platform_/, '')
}
