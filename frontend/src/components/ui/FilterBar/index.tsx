import React from 'react'

/**
 * 通用过滤栏容器 —— 取代各页面手写的 `<div className="filter-bar">` 结构
 *
 * 用法：
 *  <FilterBar>
 *    <SearchInput value={keyword} onChange={setKeyword} placeholder="搜索…" />
 *    <DropdownSelect options={typeOptions} value={type} onChange={setType} />
 *  </FilterBar>
 *
 *  <FilterBar variant="header" left={<SearchInput />} right={<Button>导出</Button>} />
 */
interface FilterBarProps {
  children?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'compact' | 'header'
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  left,
  right,
  className = '',
  style,
  variant = 'default',
}) => {
  const classes = [
    'filter-bar',
    variant === 'compact' ? 'filter-bar--compact' : '',
    variant === 'header' ? 'filter-bar--header' : '',
    className,
  ].filter(Boolean).join(' ')

  if (left || right) {
    return (
      <div className={classes} style={style}>
        {left && <div className="filter-bar__left">{left}</div>}
        {!left && children && <div className="filter-bar__left">{children}</div>}
        {right && <div className="filter-bar__right">{right}</div>}
      </div>
    )
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  )
}

export default FilterBar
