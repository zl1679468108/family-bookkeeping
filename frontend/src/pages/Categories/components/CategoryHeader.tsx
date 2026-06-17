import React from 'react'
import { Button } from '../../../components/ui/Button'
import { CardHeader } from '../../../components/ui/Card'
import { notify } from '../../../utils/notifications'

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
        <div className="cat-header-actions">
          <Button
            variant={sortingMode ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => {
              if (sortingMode) {
                handleSaveSort()
                notify({ type: 'success', message: '排序已保存' })
              } else {
                handleEnterSortMode()
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : (sortingMode ? '完成排序' : '编辑排序')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            + 新建分类
          </Button>
        </div>
      }
    />
  )
}