import React from 'react'

/**
 * 通用分页器组件
 *
 * 用法：
 *  <Pagination
 *    page={page}
 *    totalPages={totalPages}
 *    onChange={setPage}
 *    info={`第 ${page} / ${totalPages} 页 · 共 ${total} 条`}
 *  />
 */
interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  info?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  align?: 'left' | 'center' | 'right'
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onChange,
  info,
  className = '',
  style,
  align = 'right',
}) => {
  if (totalPages <= 1 && !info) return null

  return (
    <div
      className={`pagination-bar pagination-bar--${align} ${className}`.trim()}
      style={style}
    >
      <button
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
      >
        上一页
      </button>
      {info && <span className="pagination-info">{info}</span>}
      <button
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
      >
        下一页
      </button>
    </div>
  )
}

export default Pagination
