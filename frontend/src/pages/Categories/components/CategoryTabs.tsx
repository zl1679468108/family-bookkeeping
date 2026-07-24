import React from 'react'
import { SegControl } from '../../../components/ui/SegControl'
import { categoryTypeTabLabel } from '../../../utils/transactionType'

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
        { value: 'expense', label: categoryTypeTabLabel('expense') },
        { value: 'income', label: categoryTypeTabLabel('income') },
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