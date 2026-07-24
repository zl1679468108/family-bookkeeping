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

