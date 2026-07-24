/** 分页默认值 — 双端列表 / Pagination 共用 */

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 20

/** 默认可选 pageSize */
export const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100] as const

/** 首页最近流水条数 */
export const HOME_RECENT_TX_PAGE_SIZE = 5

/** 上一页 */
export const ACTION_PREV_PAGE = '上一页'

/** 下一页 */
export const ACTION_NEXT_PAGE = '下一页'

/** 共 N 条 */
export function paginationTotalLabel(total: number): string {
  return `共 ${total} 条`
}

/** totalPages<=1 且无 info 时隐藏 */
export function shouldShowPagination(totalPages: number, hasInfo = false): boolean {
  return totalPages > 1 || hasInfo
}

export function isPageAtStart(page: number): boolean {
  return page <= 1
}

export function isPageAtEnd(page: number, totalPages: number): boolean {
  return page >= totalPages
}



/** 每页 */
export const PAGINATION_PER_PAGE_LABEL = '每页'

/** 第 page / totalPages 页 */
export function paginationPageOfLabel(page: number, totalPages: number): string {
  return `第 ${page} / ${totalPages} 页`
}

/** 由 total + pageSize 计算总页数（至少 1） */
export function computeTotalPages(total: number, pageSize: number): number {
  const size = Number(pageSize) > 0 ? Number(pageSize) : DEFAULT_PAGE_SIZE
  return Math.max(1, Math.ceil(Math.max(0, Number(total) || 0) / size))
}

/** N 条/页 */
export function paginationPageSizeLabel(size: number): string {
  return `${size} 条/页`
}

/** 分页条 class（PC pagination-bar） */
export function buildPaginationBarClassName(opts: {
  align?: 'left' | 'center' | 'right'
  className?: string
  prefix?: string
} = {}): string {
  const align = opts.align || 'right'
  const prefix = opts.prefix || 'pagination-bar'
  const extra = (opts.className || '').trim()
  return [prefix, `${prefix}--${align}`, extra].filter(Boolean).join(' ')
}

/** 分页按钮 class（Taro ui-pagination__btn） */
export function buildPaginationBtnClassName(opts: {
  disabled?: boolean
  className?: string
  prefix?: string
} = {}): string {
  const prefix = opts.prefix || 'ui-pagination__btn'
  const parts = [prefix]
  if (opts.disabled) parts.push(`${prefix}--disabled`)
  if (opts.className) parts.push(opts.className)
  return parts.filter(Boolean).join(' ')
}

