import React from 'react'
import { Icon } from '../ui/Icon'

interface FilterChipProps {
  label: string
  onRemove: () => void
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => (
  <span
    onClick={onRemove}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 12,
      background: 'var(--pr)',
      color: 'var(--on-pr)',
      cursor: 'pointer',
      margin: '2px 4px',
    }}
  >
    {label}
    <Icon name="close" size={12} color="var(--on-pr)" />
  </span>
)
