import React, { useState, useEffect } from 'react'
import { incomeCategoryLabels, expenseCategoryLabels } from '../../utils/commonDic'
import './index.scss'

interface FilterBarProps {
  onFilterChange?: (filter: { type: string; category: string }) => void
  selectedType?: string
  selectedCategory?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, selectedType, selectedCategory }) => {
  const [activeType, setActiveType] = useState(selectedType || 'all')
  const [activeCategory, setActiveCategory] = useState(selectedCategory || '')

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
        {incomeCategoryLabels.map((item) => (
          <button
            key={item.value}
            className={`filter-chip category-chip ${activeCategory === item.value ? 'active' : ''} ${activeType === 'expense' ? 'disabled' : ''}`}
            onClick={() => activeType !== 'expense' && handleCategoryClick(item.value)}
            disabled={activeType === 'expense'}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {expenseCategoryLabels.map((item) => (
          <button
            key={item.value}
            className={`filter-chip category-chip ${activeCategory === item.value ? 'active' : ''} ${activeType === 'income' ? 'disabled' : ''}`}
            onClick={() => activeType !== 'income' && handleCategoryClick(item.value)}
            disabled={activeType === 'income'}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}