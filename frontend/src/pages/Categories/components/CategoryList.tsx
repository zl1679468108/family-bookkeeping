import React from 'react'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Button } from '../../../components/ui/Button'
import type { Category } from '../../../types/category'

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
        title="暂无分类"
        description="添加第一个分类，让每一笔收支都有清晰的归类。"
        action={
          onAdd ? (
            <Button variant="primary" size="sm" onClick={onAdd}>
              + 新增分类
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div className={`cat-grid${sortingMode ? ' sort-mode' : ''}`}>
      {orderedList.map((cat, idx) => {
        const isDragging = dragIndex === idx
        return (
          <div
            key={cat.id}
            className={`cat-card${isDragging ? ' dragging' : ''}`}
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
            <span className="cat-handle">⋮⋮</span>
            <div className="cat-header">
              <span className="cat-e">{renderCategoryIcon(cat.icon, { size: 18 })}</span>
              <div className="cat-content">
                <div className="cat-n">{cat.name}</div>
              </div>
            </div>
            <div className="cat-badges">
              {cat.is_default && <span className="cat-badge-default">默认</span>}
              {!cat.is_default && <span className="cat-badge-custom">自定义</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}