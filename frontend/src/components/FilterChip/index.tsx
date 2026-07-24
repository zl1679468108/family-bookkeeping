import React from 'react'
import { Icon } from '../ui/Icon'
import { buildFilterChipClassName } from '../../utils/filterChip'
import './index.scss'

interface FilterChipProps {
  label: string
  onRemove: () => void
  className?: string
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove, className = '' }) => (
  <span
    className={buildFilterChipClassName({ className })}
    onClick={onRemove}
  >
    {label}
    <Icon name="close" size={12} color="var(--on-pr)" />
  </span>
)

export default FilterChip
