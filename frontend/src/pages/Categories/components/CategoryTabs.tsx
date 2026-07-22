import React from 'react'
import { SegControl } from '../../../components/ui/SegControl'

interface CategoryTabsProps {
  activeTab: 'expense' | 'income'
  sortingMode: boolean
  handleCancelSort: () => void
  setActiveTab: (tab: 'expense' | 'income') => void
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  sortingMode,
  handleCancelSort,
  setActiveTab,
}) => {
  return (
    <SegControl
      variant="pill"
      options={[
        { value: 'expense', label: '支出分类' },
        { value: 'income', label: '收入分类' },
      ]}
      value={activeTab}
      onChange={(v) => {
        if (sortingMode) {
          handleCancelSort()
        }
        setActiveTab(v)
      }}
    />
  )
}