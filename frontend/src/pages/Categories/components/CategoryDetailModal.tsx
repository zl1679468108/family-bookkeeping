import React from 'react'
import { GlobalModal, DetailItem, Space } from '../../../components/ui'
import { Button } from '../../../components/ui/Button'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import type { Category } from '@family-bookkeeping/shared-types'
import { transactionTypeLabel } from '../../../utils/transactionType'
import { formatDateTimeMinute } from '../../../utils/date'
import { DETAIL_CATEGORY } from '../../../utils/entityCopy'
import { FIELD_SORT, sortOrderLabel, FIELD_CATEGORY_ID, FIELD_CREATED_AT, FIELD_UPDATED_AT, FIELD_DEFAULT, FIELD_CUSTOM } from '../../../utils/fieldCopy'
import { ACTION_EDIT, ACTION_DELETE } from '../../../utils/actionCopy'

interface CategoryDetailModalProps {
  selectedCategory: Category | null
  showDetail: boolean
  setShowDetail: (show: boolean) => void
  setSelectedCategory: (category: null) => void
  setDeleteTarget: (category: Category) => void
  handleOpenEdit: (category: Category) => void
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  selectedCategory,
  showDetail,
  setShowDetail,
  setSelectedCategory,
  setDeleteTarget,
  handleOpenEdit,
}) => {
  if (!selectedCategory) return null

  return (
    <GlobalModal
      type="detail"
      open={showDetail}
      onClose={() => {
        setShowDetail(false)
        setSelectedCategory(null)
      }}
      title={DETAIL_CATEGORY}
      footer={
        <Space size="sm">
          {!selectedCategory.is_default && (
            <Button
              variant="secondary"
              onClick={() => handleOpenEdit(selectedCategory)}
            >{ACTION_EDIT}</Button>
          )}
          {!selectedCategory.is_default && (
            <Button
              variant="danger"
              onClick={() => setDeleteTarget(selectedCategory)}
            >{ACTION_DELETE}</Button>
          )}
        </Space>
      }
    >
      <div className="detail-content-wrapper">
        <div className="detail-icon">{renderCategoryIcon(selectedCategory.icon, { size: 40 })}</div>
        <div className="detail-content">
          <div className="detail-title">{selectedCategory.name}</div>
          <div className="detail-tags">
            <span className={`detail-tag ${selectedCategory.type === 'expense' ? 'type-expense' : 'type-income'}`}>
              {transactionTypeLabel(selectedCategory.type)}
            </span>
            <span className={`detail-tag ${selectedCategory.is_default ? 'tag-default' : 'tag-custom'}`}>
              {selectedCategory.is_default ? FIELD_DEFAULT : FIELD_CUSTOM}
            </span>
          </div>
        </div>
      </div>
      <div className="detail-divider" />
      <div className="detail-grid">
        <DetailItem label={FIELD_CATEGORY_ID} value={selectedCategory.id} />
        <DetailItem label={FIELD_SORT} value={sortOrderLabel(selectedCategory.sort_order)} />
        {selectedCategory.created_at && (
          <DetailItem label={FIELD_CREATED_AT} value={formatDateTimeMinute(selectedCategory.created_at)} />
        )}
        {selectedCategory.updated_at && (
          <DetailItem label={FIELD_UPDATED_AT} value={formatDateTimeMinute(selectedCategory.updated_at)} />
        )}
      </div>
    </GlobalModal>
  )
}