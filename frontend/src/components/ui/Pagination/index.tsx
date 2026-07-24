import React from 'react'
import { DropdownSelect } from '../Dropdown'
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  ACTION_PREV_PAGE,
  ACTION_NEXT_PAGE,
  paginationTotalLabel,
  shouldShowPagination,
  isPageAtStart,
  isPageAtEnd,
  paginationPageOfLabel,
  PAGINATION_PER_PAGE_LABEL,
} from '../../../utils/pagination'
import { cx } from '../../../utils/cx'
export { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from '../../../utils/pagination'

/**
 * 通用分页器组件（全局）
 *
 * 两种用法：
 *
 * ① 旧式（仅上下页，传总页数）：
 *  <Pagination page={page} totalPages={totalPages} onChange={setPage} />
 *
 * ② 新式（带每页条数下拉，传总条数）：
 *  <Pagination
 *    page={page}
 *    pageSize={pageSize}            // 默认 20
 *    total={total}                 // 总条数（传了即启用 20/50/100 下拉）
 *    onChange={setPage}
 *    onPageSizeChange={setPageSize} // 切换条数后会自动回到第 1 页
 *  />
 */
interface PaginationProps {
  /** 当前页码（1-based） */
  page: number
  /** 当前每页条数，默认 20 */
  pageSize?: number
  /** 总条数：传入即启用「每页条数」下拉并自动计算总页数 */
  total?: number
  /** 兼容旧用法：直接传总页数（无 total 时生效） */
  totalPages?: number
  /** 页码变化回调 */
  onChange: (page: number) => void
  /** 每页条数变化回调（切换条数后会自动回到第 1 页） */
  onPageSizeChange?: (size: number) => void
  /** 是否显示「每页条数」下拉，默认：传了 total 即为 true */
  showSizeChanger?: boolean
  /** 每页条数可选项，默认 [20, 50, 100] */
  pageSizeOptions?: number[]
  /** 自定义信息文案，缺省时按 total 自动生成「共 X 条」 */
  info?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  align?: 'left' | 'center' | 'right'
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  total,
  totalPages,
  onChange,
  onPageSizeChange,
  showSizeChanger,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  info,
  className = '',
  style,
  align = 'right',
}) => {
  // 总页数：优先用 total 计算，否则回退到 totalPages
  const computedTotalPages = total !== undefined
    ? Math.max(1, Math.ceil(total / pageSize))
    : (totalPages ?? 1)

  // 每页条数下拉：传了 total 默认显示，可显式关闭
  const showSize = showSizeChanger !== false && total !== undefined
  const defaultInfo = total !== undefined ? paginationTotalLabel(total) : null

  const needShow = shouldShowPagination(
    computedTotalPages,
    !!(info ?? defaultInfo) || showSize,
  )
  if (!needShow) return null

  const sizeOptions = pageSizeOptions.map((s) => ({
    key: String(s),
    label: `${s} 条/页`,
  }))

  const handleSizeChange = (key: string) => {
    const size = Number(key)
    onPageSizeChange?.(size)
    onChange(1) // 切换每页条数后回到第一页
  }

  return (
    <div
      className={cx('pagination-bar', `pagination-bar--${align}`, className)}
      style={style}
    >
      {info !== undefined ? info : defaultInfo}

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={isPageAtStart(page)}
          onClick={() => onChange(Math.max(1, page - 1))}
        >
          {ACTION_PREV_PAGE}
        </button>

        {total !== undefined && (
          <span className="pagination-current">{paginationPageOfLabel(page, computedTotalPages)}</span>
        )}

        <button
          className="pagination-btn"
          disabled={isPageAtEnd(page, computedTotalPages)}
          onClick={() => onChange(Math.min(computedTotalPages, page + 1))}
        >
          {ACTION_NEXT_PAGE}
        </button>

        {showSize && (
          <div className="pagination-size">
            <span className="pagination-size__label">{PAGINATION_PER_PAGE_LABEL}</span>
            <DropdownSelect
              options={sizeOptions}
              value={String(pageSize)}
              onChange={handleSizeChange}
              allowClear={false}
              width={108}
              align="right"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Pagination
