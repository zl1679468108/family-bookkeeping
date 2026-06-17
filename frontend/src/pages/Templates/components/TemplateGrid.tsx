import React from 'react'
import { CardHeader } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
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
          <Skeleton width="80px" height="14px" />
          <Skeleton width="90px" height="24px" borderRadius="6px" />
        </div>
        <div className="tpl-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="tpl-card" style={{ pointerEvents: 'none' }}>
              <div className="tpl-header">
                <div className="tpl-e">
                  <Skeleton width="24px" height="24px" borderRadius="6px" />
                </div>
                <div className="tpl-n">
                  <Skeleton width="100%" height="14px" />
                </div>
              </div>
              <div className="tpl-content">
                <div className="tpl-meta">
                  <Skeleton width="32px" height="18px" borderRadius="6px" />
                  <Skeleton width="40px" height="12px" />
                  <Skeleton width="50px" height="12px" />
                </div>
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
          <div className="tpl-header-actions">
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
      <div className={`tpl-grid${sortingMode ? ' sort-mode' : ''}`}>
        {orderedList.map((t, idx) => {
          const cat = getCategoryInfo(t.category_id)
          const isDragging = dragIndex === idx
          return (
            <div
              key={t.id}
              className={`tpl-card${isDragging ? ' dragging' : ''}`}
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
              <span className="tpl-handle">⋮⋮</span>
              <div className="tpl-header">
                <div className="tpl-e">{renderCategoryIcon(cat.icon, { size: 18 })}</div>
                <div className="tpl-n">{t.name}</div>
              </div>
              <div className="tpl-content">
                <div className="tpl-meta">
                  <span className={`tpl-type ${t.type}`}>{t.type === 'expense' ? '支出' : '收入'}</span>
                  <span className="tpl-cat">{cat.name}</span>
                  {t.amount && <span className={`tpl-amt tpl-amt-${t.type}`}>{formatAmount(t.amount)}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
