import React, { useState, useEffect } from 'react'

interface FilterBarProps {
  filters: string[]
  onFilterChange?: (filter: string) => void
  selectedFilter?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, selectedFilter }) => {
  const [activeFilter, setActiveFilter] = useState(selectedFilter || filters[0] || 'all')

  useEffect(() => {
    if (selectedFilter !== undefined) {
      setActiveFilter(selectedFilter)
    }
  }, [selectedFilter])

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter)
    onFilterChange?.(filter)
  }

  return (
    <div className="filter-bar">
      {filters.map((filter) => (
        <button
          key={filter}
          className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
          onClick={() => handleFilterClick(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}