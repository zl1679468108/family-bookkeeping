import React from 'react'
import { CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
import { EmptyState } from '../../../components/ui/EmptyState'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import { formatAmount } from '../../../utils/common'

interface TemplateGridProps {
  isLoading: boolean
  sortingMode: boolean
  dragIndex: number | null
  orderedList: any[]
  isSaving: boolean
  onEnterSortMode: () => void
  onSaveSort: () => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
  onNew: () => void
  onSelect: (t: any) => void
  getCategoryInfo: (categoryId: string | undefined) => { icon: string; name: string }
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  isLoading,
  sortingMode,
  dragIndex,
  orderedList,
  isSaving,
  onEnterSortMode,
  onSaveSort,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onNew,
  onSelect,
  getCategoryInfo,
}) => {
  if (isLoading) {
    return (
      <>
        <div className="card-header">
          <Skeleton width="60px" height="14px" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="80px" height="24px" borderRadius="6px" />
            <Skeleton width="70px" height="24px" borderRadius="6px" />
          </div>
        </div>
        <div className="list-card-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="list-card" style={{ pointerEvents: 'none' }}>
              <div className="list-card__header">
                <Skeleton width="22px" height="22px" borderRadius="6px" />
                <Skeleton width="50%" height="14px" />
              </div>
              <div className="list-card__content">
                <Skeleton width="32px" height="18px" borderRadius="6px" />
                <Skeleton width="40px" height="12px" />
                <Skeleton width="50px" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <CardHeader
        title="交易模板"
        action={
          <div className="list-card-grid__header-actions">
            <Button
              variant={sortingMode ? 'outline' : 'secondary'}
              size="sm"
              onClick={sortingMode ? onSaveSort : onEnterSortMode}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : (sortingMode ? '完成排序' : '编辑排序')}
            </Button>
            <Button variant="primary" size="sm" onClick={onNew}>
              + 新建模板
            </Button>
          </div>
        }
      />
      {orderedList.length === 0 ? (
        <EmptyState
          description="还没有交易模板，创建后记账可一键套用"
        />
      ) : (
        <div className={`list-card-grid${sortingMode ? ' sort-mode' : ''}`}>
          {orderedList.map((t, idx) => {
          const cat = getCategoryInfo(t.category_id)
          const isDragging = dragIndex === idx
          return (
            <div
              key={t.id}
              className={`list-card${isDragging ? ' dragging' : ''}`}
              draggable={sortingMode}
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onClick={() => {
                if (!sortingMode) {
                  onSelect(t)
                }
              }}
              style={{ cursor: sortingMode ? 'grab' : 'pointer' }}
            >
              {sortingMode && (
                <span className="list-card__handle">⋮⋮</span>
              )}
              <div className="list-card__header">
                <span className="list-card__icon">{renderCategoryIcon(cat.icon, { size: 18 })}</span>
                <span className="list-card__title">{t.name}</span>
              </div>
              <div className="list-card__content">
                <span className={`list-card__badge list-card__badge--${t.type}`}>{t.type === 'expense' ? '支出' : '收入'}</span>
                <span className="list-card__cat">{cat.name}</span>
                {t.amount && (
                  <span className={`list-card__amt list-card__amt--${t.type}`}>{formatAmount(t.amount)}</span>
                )}
              </div>
            </div>
          )
        })}
        </div>
      )}
    </>
  )
}
