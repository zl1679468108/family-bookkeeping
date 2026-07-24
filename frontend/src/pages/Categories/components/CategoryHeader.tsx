import React from 'react'
import { Button } from '../../../components/ui/Button'
import { CardHeader } from '../../../components/ui/Card'

import { notifySuccess } from '../../../utils/notifyError'
import { busyLabel, ACTION_SAVING } from '../../../utils/actionCopy'
import { sortModeLabel, SORT_SAVED } from '../../../utils/sortCopy'

interface CategoryHeaderProps {
  sortingMode: boolean
  isSaving: boolean
  handleSaveSort: () => void
  handleEnterSortMode: () => void
  handleOpenAdd: () => void
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  sortingMode,
  isSaving,
  handleSaveSort,
  handleEnterSortMode,
  handleOpenAdd,
}) => {
  return (
    <CardHeader
      title="分类管理"
      action={
        <div className="list-card-grid__header-actions">
          <Button
            variant={sortingMode ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => {
              if (sortingMode) {
                handleSaveSort()
                notifySuccess(SORT_SAVED)
              } else {
                handleEnterSortMode()
              }
            }}
            disabled={isSaving}
          >
            {busyLabel(isSaving, ACTION_SAVING, sortModeLabel(sortingMode))}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            + 新建分类
          </Button>
        </div>
      }
    />
  )
}
