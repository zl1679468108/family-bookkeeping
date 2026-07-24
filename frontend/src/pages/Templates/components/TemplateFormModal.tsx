import React from 'react'
import { GlobalModal } from '../../../components/ui'
import { Button } from '../../../components/ui/Button'
import { FooterActions } from '../../../components/ui/FooterActions'
import { Input, NumberInput } from '../../../components/ui/Input'
import { DropdownSelect } from '../../../components/ui/Dropdown'
import { LocationDisplay } from '../../../components/ui/LocationDisplay'
import { LocationPicker } from '../../AddTransaction/components/LocationPicker'
import type { LocationResult } from '@family-bookkeeping/shared-types'
import { FREQUENCY_OPTIONS } from '../../../utils/frequency'
import { TRANSACTION_TYPE_OPTIONS } from '../../../utils/transactionType'

interface TemplateFormProps {
  open: boolean
  editingId: string | null
  form: {
    name: string
    type: 'income' | 'expense'
    category_id: string
    amount: string
    note: string
    latitude: string
    longitude: string
    location_name: string
    poi_id: string
    sort_order: number
    frequency: string
    start_date: string
    end_date: string
  }
  setForm: React.Dispatch<React.SetStateAction<any>>
  categories: any[]
  showLocationPicker: boolean
  setShowLocationPicker: (v: boolean) => void
  onClose: () => void
  onSave: () => void
  saveLoading: boolean
  onLocationConfirm: (loc: LocationResult) => void
}

export const TemplateFormModal: React.FC<TemplateFormProps> = ({
  open,
  editingId,
  form,
  setForm,
  categories,
  showLocationPicker,
  setShowLocationPicker,
  onClose,
  onSave,
  saveLoading,
  onLocationConfirm,
}) => {
  return (
    <>
      <GlobalModal
        open={open}
        onClose={onClose}
        title={editingId ? '编辑模板' : '新建模板'}
        footer={
          <FooterActions align="end" className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button
              variant="primary"
              onClick={onSave}
              disabled={saveLoading}
            >
              {saveLoading ? '保存中...' : (editingId ? '更新' : '创建')}
            </Button>
          </FooterActions>
        }
      >
        <div className="tpl-form">
          <Input
            label="模板名称"
            placeholder="如：公司食堂午餐"
            value={form.name}
            onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value.slice(0, 20) }))}
            autoFocus
            maxLength={20}
            required
          />
          <div className="tpl-form-row">
            <DropdownSelect
              label="类型"
              value={form.type}
              onChange={(v) => setForm((prev: any) => ({ ...prev, type: v as 'income' | 'expense', category_id: '' }))}
              options={[...TRANSACTION_TYPE_OPTIONS]}
              placeholder="选择类型"
              required
            />
            <DropdownSelect
              label="分类"
              value={form.category_id}
              onChange={(v) => setForm((prev: any) => ({ ...prev, category_id: v }))}
              options={categories
                .filter((c: any) => c.type === form.type)
                .map((c: any) => ({ key: c.id, label: `${c.icon} ${c.name}` }))}
              placeholder="选择分类"
              required
            />
          </div>
          <NumberInput
            label="金额"
            prefix="¥"
            placeholder="0.00"
            value={form.amount}
            onChange={(v) => setForm((prev: any) => ({ ...prev, amount: v }))}
          />
          <Input
            label="备注"
            placeholder="添加备注（可选）"
            value={form.note}
            onChange={(e) => setForm((prev: any) => ({ ...prev, note: e.target.value }))}
          />
          <div className="tpl-form-location">
            <label className="tpl-form-label">位置信息</label>
            <div className="tpl-form-location-row">
              {form.location_name ? (
                <LocationDisplay
                  locationName={form.location_name}
                  latitude={form.latitude}
                  longitude={form.longitude}
                  poiId={form.poi_id || undefined}
                  onClick={() => setShowLocationPicker(true)}
                  onClear={() => setForm((prev: any) => ({ ...prev, latitude: '', longitude: '', location_name: '', poi_id: '' }))}
                />
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setShowLocationPicker(true)}>
                  📍 选择位置
                </Button>
              )}
            </div>
          </div>
          {!editingId && (
            <div className="tpl-form-row full-width">
              <NumberInput
                label="排序"
                value={String(form.sort_order || 0)}
                onChange={(v) => setForm((prev: any) => ({ ...prev, sort_order: parseInt(v) || 0 }))}
                placeholder="0"
              />
            </div>
          )}
          <div className="tpl-form-recurring">
            <label className="tpl-form-label">周期记账（可选）</label>
            <div className="tpl-form-row">
              <DropdownSelect
                label="频率"
                value={form.frequency || ''}
                onChange={(v) => setForm((prev: any) => ({ ...prev, frequency: v || undefined }))}
                options={[{ key: '', label: '不重复' }, ...FREQUENCY_OPTIONS]}
                placeholder="选择频率"
              />
            </div>
            {form.frequency && (
              <div className="tpl-form-row">
                <Input
                  label="开始日期"
                  type="date"
                  value={form.start_date || ''}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, start_date: e.target.value }))}
                />
                <Input
                  label="结束日期（可选）"
                  type="date"
                  value={form.end_date || ''}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            )}
          </div>
        </div>
      </GlobalModal>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={onLocationConfirm}
        initialLocation={form.latitude && form.longitude ? {
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          locationName: form.location_name,
          poiId: form.poi_id,
        } : null}
      />
    </>
  )
}
