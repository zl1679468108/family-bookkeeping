import React from 'react'
import { GlobalModal, DetailItem, FooterActions } from '../../../components/ui'
import { Button } from '../../../components/ui/Button'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import { formatMoney } from '../../../utils/budget'
import { formatFrequency } from '../../../utils/frequency'
import { getNextExecutionDate } from '../../../utils/templateRecurring'
import { transactionTypeLabel } from '../../../utils/transactionType'
import { formatDateTimeMinute } from '../../../utils/date'
import { DETAIL_TEMPLATE } from '../../../utils/entityCopy'
import { FIELD_NOTE, FIELD_LOCATION, FIELD_SORT, FIELD_START_DATE, sortOrderLabel, FIELD_MERCHANT, FIELD_CYCLE, FIELD_END_DATE, FIELD_LAST_EXECUTED, FIELD_NEXT_EXECUTED, FIELD_CREATED_AT } from '../../../utils/fieldCopy'
import { ACTION_DELETE, ACTION_EDIT, ACTION_COPY } from '../../../utils/actionCopy'
import {
  buildTemplateTypeTagClassName,
  buildTemplateAmountTagClassName,
} from '../../../utils/typeTag'

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
      title={DETAIL_TEMPLATE}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
          <Button variant="secondary" onClick={() => onEdit(template)}>
            {ACTION_EDIT}
          </Button>
          <Button variant="secondary" onClick={() => onCopy(template)}>
            {ACTION_COPY}
          </Button>
          <Button variant="danger" onClick={onDelete}>{ACTION_DELETE}</Button>
        </FooterActions>
      }
    >
      <div className="detail-content-wrapper">
        <div className="detail-icon">{renderCategoryIcon(getCategoryInfo(template.category_id).icon, { size: 40 })}</div>
        <div className="detail-content">
          <div className="detail-title">{template.name}</div>
          <div className="detail-subtitle">
            <span className={buildTemplateTypeTagClassName({ type: template.type })}>
              {transactionTypeLabel(template.type)}
            </span>
            {template.amount && (
              <span className={buildTemplateAmountTagClassName({ type: template.type })}>
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
        {template.note && <DetailItem label={FIELD_NOTE} value={template.note} />}
        {(template.location_name || (template.latitude && template.longitude)) && (
          <DetailItem
            label={FIELD_LOCATION}
            className="full-width"
            value={
              template.location_name
                || `${Number(template.latitude).toFixed(5)}, ${Number(template.longitude).toFixed(5)}`
            }
          />
        )}
        {template.merchant_name && (
          <DetailItem
            label={FIELD_MERCHANT}
            value={<span className="merchant-name-truncate" title={template.merchant_name}>{template.merchant_name}</span>}
          />
        )}
        {template.sort_order !== undefined && (
          <DetailItem label={FIELD_SORT} value={sortOrderLabel(template.sort_order)} />
        )}
        {template.frequency && (
          <DetailItem label={FIELD_CYCLE} value={formatFrequency(template.frequency)} />
        )}
        {template.start_date && (
          <DetailItem label={FIELD_START_DATE} value={template.start_date} />
        )}
        {template.end_date && (
          <DetailItem label={FIELD_END_DATE} value={template.end_date} />
        )}
        {template.last_executed_at && (
          <DetailItem label={FIELD_LAST_EXECUTED} value={template.last_executed_at} />
        )}
        {template.frequency && (
          <DetailItem label={FIELD_NEXT_EXECUTED} value={getNextExecutionDate(template)} />
        )}
        {template.created_at && (
          <DetailItem label={FIELD_CREATED_AT} value={formatDateTimeMinute(template.created_at)} />
        )}
      </div>
    </GlobalModal>
  )
}
