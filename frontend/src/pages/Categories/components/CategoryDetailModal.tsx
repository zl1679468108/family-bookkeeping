import React from 'react'
import { format } from 'date-fns'
import { GlobalModal, DetailItem, Space } from '../../../components/ui'
import { Button } from '../../../components/ui/Button'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import type { Category } from '@family-bookkeeping/shared-types'
import { transactionTypeLabel } from '../../../utils/transactionType'

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
      title="分类详情"
      footer={
        <Space size="sm">
          {!selectedCategory.is_default && (
            <Button
              variant="secondary"
              onClick={() => handleOpenEdit(selectedCategory)}
            >
              编辑
            </Button>
          )}
          {!selectedCategory.is_default && (
            <Button
              variant="danger"
              onClick={() => setDeleteTarget(selectedCategory)}
            >
              删除
            </Button>
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
              {selectedCategory.is_default ? '默认' : '自定义'}
            </span>
          </div>
        </div>
      </div>
      <div className="detail-divider" />
      <div className="detail-grid">
        <DetailItem label="分类 ID" value={selectedCategory.id} />
        <DetailItem label="排序" value={`第 ${selectedCategory.sort_order + 1} 位`} />
        {selectedCategory.created_at && (
          <DetailItem label="创建时间" value={format(new Date(selectedCategory.created_at), 'yyyy-MM-dd HH:mm')} />
        )}
        {selectedCategory.updated_at && (
          <DetailItem label="更新时间" value={format(new Date(selectedCategory.updated_at), 'yyyy-MM-dd HH:mm')} />
        )}
      </div>
    </GlobalModal>
  )
}