import React, { useState } from 'react'
import { ListRowsSkeleton } from '../../../../components/ui/Skeleton'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { Button } from '../../../../components/ui/Button'
import { FooterActions } from '../../../../components/ui/FooterActions'
import './index.scss'
import { Icon } from '../../../../components/ui/Icon'

interface TemplateSelectorProps {
  visible: boolean
  loading?: boolean
  onClose: () => void
  onConfirm: (template: any) => void
  templates: any[]
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  visible,
  loading,
  onClose,
  onConfirm,
  templates,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleConfirm = () => {
    if (!selectedId) return
    const tpl = templates.find(t => String(t.id) === selectedId)
    if (tpl) {
      onConfirm(tpl)
    }
    setSelectedId(null)
  }

  const handleClose = () => {
    setSelectedId(null)
    onClose()
  }

  if (!visible) return null

  return (
    <div className="template-selector-overlay" onClick={handleClose}>
      <div className="template-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-selector-header">
          <h3>选择模板</h3>
          <button type="button" className="template-selector-close" onClick={handleClose} aria-label="关闭"><Icon name="close" size={16} /></button>
        </div>

        <div className="template-selector-body">
          {loading ? (
            <ListRowsSkeleton rows={4} showIcon showAmount={false} />
          ) : templates.length === 0 ? (
            <EmptyState
              variant="compact"
              description="暂无模板，请先在「模板管理」中创建"
            />
          ) : (
            <div className="template-list">
              {templates.map((tpl) => {
                const isSelected = String(tpl.id) === selectedId
                return (
                  <div
                    key={tpl.id}
                    className={`template-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedId(String(tpl.id))}
                  >
                    <div className="template-item-info">
                      {/* 第一行：名称 + 类型 */}
                      <div className="template-item-top">
                        <span className="template-item-name">{tpl.name}</span>
                        <span className={`template-type ${tpl.type}`}>
                          {tpl.type === 'income' ? '收入' : '支出'}
                        </span>
                      </div>
                      {/* 第二行：备注/分类 + 金额 */}
                      <div className="template-item-bottom">
                        <span className="template-note">{tpl.note || tpl.category_name || ''}</span>
                        {tpl.amount && <span className="template-amount">¥{tpl.amount}</span>}
                        {tpl.frequency && (
                          <span className="template-recurring-badge">
                            {tpl.frequency === 'daily' ? '每日' : tpl.frequency === 'weekly' ? '每周' : tpl.frequency === 'monthly' ? '每月' : tpl.frequency === 'quarterly' ? '每季' : '每年'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`template-radio ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="radio-dot" />}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <FooterActions align="end" className="template-selector-footer">
          <Button variant="secondary" onClick={handleClose}>取消</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedId}
          >
            确认选择
          </Button>
        </FooterActions>
      </div>
    </div>
  )
}

export default TemplateSelector
