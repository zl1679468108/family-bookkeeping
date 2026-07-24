import React from 'react'
import { Button } from '../../../components/ui/Button'
import { CardHeader } from '../../../components/ui/Card'

import { notifySuccess, notifyInfo } from '../../../utils/notifyError'
import { busyLabel, ACTION_SAVING } from '../../../utils/actionCopy'
import { sortModeLabel, SORT_SAVED, SORT_UNCHANGED, SORT_NOTHING } from '../../../utils/sortCopy'
import { entityCreateButton, ENTITY_CATEGORY } from '../../../utils/entityCopy'
import type { SortSaveResult } from '../../../hooks/useSort'
import { TITLE_CATEGORY_MANAGE } from '../../../utils/sectionCopy'

interface CategoryHeaderProps {
  sortingMode: boolean
  isSaving: boolean
  handleSaveSort: () => Promise<SortSaveResult | undefined>
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
      title={TITLE_CATEGORY_MANAGE}
      action={
        <div className="list-card-grid__header-actions">
          <Button
            variant={sortingMode ? 'outline' : 'secondary'}
            size="sm"
            onClick={async () => {
              if (sortingMode) {
                const result = await handleSaveSort()
                if (result === 'saved') notifySuccess(SORT_SAVED)
                else if (result === 'unchanged') notifyInfo(SORT_UNCHANGED)
                else if (result === 'empty') notifyInfo(SORT_NOTHING)
              } else {
                handleEnterSortMode()
              }
            }}
            disabled={isSaving}
          >
            {busyLabel(isSaving, ACTION_SAVING, sortModeLabel(sortingMode))}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            {entityCreateButton(ENTITY_CATEGORY)}
          </Button>
        </div>
      }
    />
  )
}
