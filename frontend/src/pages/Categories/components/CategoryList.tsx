import React from 'react'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import { EmptyState } from '../../../components/ui/EmptyState'
import { EmptyActionButton } from '../../../components/ui/EmptyState/emptyActions'
import type { Category } from '@family-bookkeeping/shared-types'

interface CategoryListProps {
  orderedList: Category[]
  sortingMode: boolean
  dragIndex: number | null
  handleDragStart: (index: number) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDrop: (e: React.DragEvent) => void
  handleDragEnd: () => void
  setSelectedCategory: (category: Category) => void
  setShowDetail: (show: boolean) => void
  onAdd?: () => void
}

export const CategoryList: React.FC<CategoryListProps> = ({
  orderedList,
  sortingMode,
  dragIndex,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  setSelectedCategory,
  setShowDetail,
  onAdd,
}) => {
  if (orderedList.length === 0) {
    return (
      <EmptyState
        description="暂无分类，添加第一个让收支都有清晰归类"
        action={
          onAdd ? (
            <EmptyActionButton size="sm" onClick={onAdd}>
              + 新增分类
            </EmptyActionButton>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className="list-card-grid">
      {orderedList.map((cat, idx) => {
        const isDragging = dragIndex === idx
        return (
          <div
            key={cat.id}
            className={`list-card${isDragging ? ' dragging' : ''}`}
            draggable={sortingMode}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (!sortingMode) {
                setSelectedCategory(cat)
                setShowDetail(true)
              }
            }}
            style={{ cursor: sortingMode ? 'grab' : 'pointer' }}
          >
            {sortingMode && (
              <span className="list-card__handle">⋮⋮</span>
            )}
            <div className="list-card__header">
              <span className="list-card__icon">{renderCategoryIcon(cat.icon, { size: 18 })}</span>
              <span className="list-card__title">{cat.name}</span>
            </div>
            <div className="list-card__content">
              {cat.is_default && <span className="list-card__badge list-card__badge--default">默认</span>}
              {!cat.is_default && <span className="list-card__badge list-card__badge--custom">自定义</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}