import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useCategories } from '../../hooks/useCategories'
import { FilterChip } from '../FilterChip'
import './index.scss'

interface ActiveChip {
  label: string
  onRemove: () => void
}

interface FilterBarProps {
  onFilterChange?: (filter: { type: string; category: string }) => void
  selectedType?: string
  selectedCategory?: string
  search?: string
  onSearchChange?: (value: string) => void
  /** Optional React node rendered between the search box and category buttons (e.g. FilterPanel) */
  filterPanel?: React.ReactNode
  /** Active filter chips displayed below the search box */
  activeChips?: ActiveChip[]
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  selectedType,
  selectedCategory,
  search = '',
  onSearchChange,
  filterPanel,
  activeChips = [],
}) => {
  const [activeType, setActiveType] = useState(selectedType || 'all')
  const [activeCategory, setActiveCategory] = useState(selectedCategory || '')
  const [searchValue, setSearchValue] = useState(search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 获取分类数据
  const { data: categories = [] } = useCategories()
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  useEffect(() => {
    if (selectedType !== undefined) {
      setActiveType(selectedType)
    }
  }, [selectedType])

  useEffect(() => {
    if (selectedCategory !== undefined) {
      setActiveCategory(selectedCategory)
    }
  }, [selectedCategory])

  useEffect(() => {
    setSearchValue(search)
  }, [search])

  // 搜索 debounce（300ms）
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange?.(value)
    }, 300)
  }, [onSearchChange])

  const handleSearchClear = useCallback(() => {
    setSearchValue('')
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    onSearchChange?.('')
  }, [onSearchChange])

  // 清理 debounce timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleTypeClick = (type: string) => {
    setActiveType(type)
    setActiveCategory('')
    onFilterChange?.({ type, category: '' })
  }

  const handleCategoryClick = (category: string) => {
    setActiveCategory(activeCategory === category ? '' : category)
    onFilterChange?.({ type: activeType, category: activeCategory === category ? '' : category })
  }

  const typeOptions = [
    { value: 'all', label: '全部' },
    { value: 'income', label: '收入' },
    { value: 'expense', label: '支出' }
  ]

  return (
    <div className="filter-bar">
      {/* 搜索输入框 */}
      {onSearchChange && (
        <div className="filter-search">
          <div className="filter-search-input-wrapper">
            <svg className="filter-search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              className="filter-search-input"
              placeholder="搜索交易描述…"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchValue && (
              <button
                className="filter-search-clear"
                onClick={handleSearchClear}
                type="button"
                aria-label="清空搜索"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips — displayed below the search box */}
      {activeChips.length > 0 && (
        <div className="filter-bar__chips" style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          {activeChips.map((chip, idx) => (
            <FilterChip key={idx} label={chip.label} onRemove={chip.onRemove} />
          ))}
        </div>
      )}

      {/* Filter panel — inserted between search and category buttons */}
      {filterPanel && (
        <div style={{ marginBottom: '12px' }}>
          {filterPanel}
        </div>
      )}

      <div className="filter-row">
        {typeOptions.map((item) => (
          <button
            key={item.value}
            className={`filter-chip ${activeType === item.value ? 'active' : ''}`}
            onClick={() => handleTypeClick(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {incomeCategories.map((item) => (
          <button
            key={item.id}
            className={`filter-chip category-chip ${activeCategory === item.id ? 'active' : ''} ${activeType === 'expense' ? 'disabled' : ''}`}
            onClick={() => activeType !== 'expense' && handleCategoryClick(item.id)}
            disabled={activeType === 'expense'}
          >
            {item.icon} {item.name}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {expenseCategories.map((item) => (
          <button
            key={item.id}
            className={`filter-chip category-chip ${activeCategory === item.id ? 'active' : ''} ${activeType === 'income' ? 'disabled' : ''}`}
            onClick={() => activeType !== 'income' && handleCategoryClick(item.id)}
            disabled={activeType === 'income'}
          >
            {item.icon} {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}
