import React from 'react'
import { GlobalModal, DetailItem, Space } from '../../../components/ui'
import { Button } from '../../../components/ui/Button'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import { formatMoney } from '../../../utils/budget'
import { formatFrequency } from '../../../utils/frequency'
import { transactionTypeLabel } from '../../../utils/transactionType'
import { formatDateTimeMinute } from '../../../utils/date'

interface TemplateDetailModalProps {
  template: any
  open: boolean
  onClose: () => void
  onEdit: (t: any) => void
  onCopy: (t: any) => void
  onDelete: () => void
  getCategoryInfo: (categoryId: string | undefined) => { icon: string; name: string }
}

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  open,
  onClose,
  onEdit,
  onCopy,
  onDelete,
  getCategoryInfo,
}) => {
  if (!template) return null

  return (
    <GlobalModal
      type="detail"
      open={open}
      onClose={onClose}
      title="模板详情"
      footer={
        <Space size="sm">
          <Button variant="secondary" onClick={() => onEdit(template)}>
            编辑
          </Button>
          <Button variant="secondary" onClick={() => onCopy(template)}>
            复制
          </Button>
          <Button variant="danger" onClick={onDelete}>
            删除
          </Button>
        </Space>
      }
    >
      <div className="detail-content-wrapper">
        <div className="detail-icon">{renderCategoryIcon(getCategoryInfo(template.category_id).icon, { size: 40 })}</div>
        <div className="detail-content">
          <div className="detail-title">{template.name}</div>
          <div className="detail-subtitle">
            <span className={`tpl-tag tpl-tag-type tpl-tag-${template.type}`}>
              {transactionTypeLabel(template.type)}
            </span>
            {template.amount && (
              <span className={`tpl-tag tpl-tag-amount tpl-tag-${template.type}`}>
                {formatMoney(template.amount)}
              </span>
            )}
            <span className="tpl-tag tpl-tag-cat">
              {getCategoryInfo(template.category_id).name}
            </span>
          </div>
        </div>
      </div>
      <div className="detail-divider" />
      <div className="detail-grid">
        {template.note && <DetailItem label="备注" value={template.note} />}
        {(template.location_name || (template.latitude && template.longitude)) && (
          <DetailItem
            label="位置"
            className="full-width"
            value={
              template.location_name
                || `${Number(template.latitude).toFixed(5)}, ${Number(template.longitude).toFixed(5)}`
            }
          />
        )}
        {template.merchant_name && (
          <DetailItem
            label="商户"
            value={<span className="merchant-name-truncate" title={template.merchant_name}>{template.merchant_name}</span>}
          />
        )}
        {template.sort_order !== undefined && (
          <DetailItem label="排序" value={`第 ${template.sort_order + 1} 位`} />
        )}
        {template.frequency && (
          <DetailItem label="周期" value={formatFrequency(template.frequency)} />
        )}
        {template.start_date && (
          <DetailItem label="开始日期" value={template.start_date} />
        )}
        {template.end_date && (
          <DetailItem label="结束日期" value={template.end_date} />
        )}
        {template.last_executed_at && (
          <DetailItem label="上次执行" value={template.last_executed_at} />
        )}
        {template.created_at && (
          <DetailItem label="创建时间" value={formatDateTimeMinute(template.created_at)} />
        )}
      </div>
    </GlobalModal>
  )
}
