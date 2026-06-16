import React, { useState } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, reorderTemplates } from '../../services/templatesApi'
import { useCategories } from '../../hooks/useCategories'
import { formatAmount } from '../../utils/common'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { GlobalModal, DetailItem, Space } from '../../components/ui'
import { CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, NumberInput } from '../../components/ui/Input'
import { DropdownSelect } from '../../components/ui/Dropdown'
import { LocationDisplay } from '../../components/ui/LocationDisplay'
import { LocationPicker } from '../AddTransaction/components/LocationPicker'
import { useSort } from '../../hooks/useSort'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import type { CreateTemplateInput } from '../../types/template'
import type { LocationResult } from '../../types/map'

const Templates: React.FC = () => {
  const queryClient = useQueryClient()

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { run: handleDeleteTemplate, isRunning: deleteLoading } = useDebouncedAction(async () => {
    deleteTemplate(selectedTemplate.id)
    queryClient.invalidateQueries({ queryKey: ['templates'] })
    setShowDetail(false)
    setShowDeleteConfirm(false)
    setSelectedTemplate(null)
    notify({ type: 'success', message: '模板已删除' })
  })
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  })
  const { data: categories = [] } = useCategories()

  // 使用可复用排序 Hooks
  const {
    sortingMode,
    dragIndex,
    orderedList,
    handleEnterSortMode,
    handleSaveSort,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isSaving,
  } = useSort(['templates'], templates, (orders) => {
    // 适配 templates 的 reorder 接口（只需要 ids）
    const ids = orders.map(o => o.id)
    return reorderTemplates({ ids })
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateInput) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      notify({ type: 'success', message: '模板已创建' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTemplateInput> }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      notify({ type: 'success', message: '模板已更新' })
      setShowForm(false)
      setShowDetail(false)
      setSelectedTemplate(null)
    },
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    amount: '',
    note: '',
    latitude: '',
    longitude: '',
    location_name: '',
    poi_id: '',
    sort_order: 0,
  })

  const resetForm = () => {
    // 计算当前分类下已有模板数量 +1 作为默认排序值
    const currentTypeTemplates = templates.filter(t => t.type === form.type)
    const nextSortOrder = currentTypeTemplates.length + 1
    setForm({ name: '', type: 'expense', category_id: '', amount: '', note: '', latitude: '', longitude: '', location_name: '', poi_id: '', sort_order: nextSortOrder })
    setShowForm(false)
    setEditingId(null)
  }

  const { run: handleSave, isRunning: saveLoading } = useDebouncedAction(async () => {
    if (!form.name.trim()) {
      notify({ type: 'error', message: '请输入模板名称' })
      return
    }
    const data: CreateTemplateInput = {
      name: form.name.trim(),
      type: form.type,
      category_id: form.category_id || undefined,
      amount: form.amount ? parseFloat(form.amount) : undefined,
      note: form.note || undefined,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      location_name: form.location_name || undefined,
      poi_id: form.poi_id || undefined,
      sort_order: form.sort_order || 0,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data }, { onSuccess: resetForm })
    } else {
      createMutation.mutate(data, { onSuccess: resetForm })
    }
  })

  const handleEdit = (t: any) => {
    setForm({
      name: t.name,
      type: t.type,
      category_id: t.category_id || '',
      amount: t.amount ? String(t.amount) : '',
      note: t.note || '',
      latitude: t.latitude ? String(t.latitude) : '',
      longitude: t.longitude ? String(t.longitude) : '',
      location_name: t.location_name || '',
      poi_id: t.poi_id || '',
      sort_order: t.sort_order || 0,
    })
    setEditingId(t.id)
    setShowForm(true)
  }

  const handleCopy = (t: any) => {
    setForm({
      name: `${t.name} (副本)`,
      type: t.type,
      category_id: t.category_id || '',
      amount: t.amount ? String(t.amount) : '',
      note: t.note || '',
      latitude: t.latitude ? String(t.latitude) : '',
      longitude: t.longitude ? String(t.longitude) : '',
      location_name: t.location_name || '',
      poi_id: t.poi_id || '',
      sort_order: t.sort_order || 0,
    })
    setEditingId(null)
    setShowForm(true)
  }

  const handleLocationConfirm = (location: LocationResult) => {
    setForm(prev => ({
      ...prev,
      latitude: location.latitude ? String(location.latitude) : '',
      longitude: location.longitude ? String(location.longitude) : '',
      location_name: location.locationName || '',
      poi_id: location.poiId || '',
    }))
    setShowLocationPicker(false)
  }

  const getCategoryInfo = (categoryId: string | undefined) => {
    if (!categoryId) return { icon: '', name: '未分类' }
    const cat = categories.find(c => c.id === categoryId)
    return cat ? { icon: cat.icon, name: cat.name } : { icon: '', name: '未分类' }
  }

  return (
    <div className="page-container">
      <div className="dash-card">
        {isLoading ? (
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
        ) : (
          <>
            <CardHeader
              title="交易模板"
              action={
                <div className="tpl-header-actions">
                  <Button
                    variant={sortingMode ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={sortingMode ? handleSaveSort : handleEnterSortMode}
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : (sortingMode ? '完成排序' : '编辑排序')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
                    + 新建模板
                  </Button>
                </div>
              }
            />

            {/* 模板网格 */}
            <div className={`tpl-grid${sortingMode ? ' sort-mode' : ''}`}>
            {orderedList.map((t, idx) => {
              const cat = getCategoryInfo(t.category_id)
              const isDragging = dragIndex === idx
              return (
                <div
                  key={t.id}
                  className={`tpl-card${isDragging ? ' dragging' : ''}`}
                  draggable={sortingMode}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (!sortingMode) {
                      setSelectedTemplate(t)
                      setShowDetail(true)
                    }
                  }}
                  style={{ cursor: sortingMode ? 'grab' : 'pointer' }}
                >
                  {/* 拖拽手柄 */}
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
        )}
      </div>

      {/* 模板详情弹窗 */}
      {selectedTemplate && (
        <GlobalModal
          type="detail"
          open={showDetail}
          onClose={() => {
            setShowDetail(false)
            setSelectedTemplate(null)
          }}
          title="模板详情"
          footer={
            <Space size="sm">
              <Button variant="secondary" onClick={() => handleEdit(selectedTemplate)}>
                编辑
              </Button>
              <Button variant="secondary" onClick={() => handleCopy(selectedTemplate)}>
                复制
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除
              </Button>
            </Space>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{renderCategoryIcon(getCategoryInfo(selectedTemplate.category_id).icon, { size: 40 })}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedTemplate.name}</div>
              <div className="detail-subtitle">
                <span className={`tpl-tag tpl-tag-type tpl-tag-${selectedTemplate.type}`}>
                  {selectedTemplate.type === 'expense' ? '支出' : '收入'}
                </span>
                {selectedTemplate.amount && (
                  <span className={`tpl-tag tpl-tag-amount tpl-tag-${selectedTemplate.type}`}>
                    ¥{selectedTemplate.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                <span className="tpl-tag tpl-tag-cat">
                  {getCategoryInfo(selectedTemplate.category_id).name}
                </span>
              </div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            {selectedTemplate.note && <DetailItem label="备注" value={selectedTemplate.note} />}
            {selectedTemplate.latitude && selectedTemplate.longitude && (
              <DetailItem label="位置" value={`${selectedTemplate.latitude}, ${selectedTemplate.longitude}`} className="full-width" />
            )}
            {selectedTemplate.location_name && (
              <DetailItem label="地址" value={selectedTemplate.location_name} className="full-width" />
            )}
            {selectedTemplate.poi_id && <DetailItem label="商户 ID" value={selectedTemplate.poi_id} />}
            {selectedTemplate.merchant_name && (
              <DetailItem
                label="商户名称"
                value={<span className="merchant-name-truncate" title={selectedTemplate.merchant_name}>{selectedTemplate.merchant_name}</span>}
              />
            )}
            {selectedTemplate.book_id && <DetailItem label="账本 ID" value={selectedTemplate.book_id} />}
            {selectedTemplate.sort_order !== undefined && (
              <DetailItem label="排序" value={`第 ${selectedTemplate.sort_order + 1} 位`} />
            )}
            {selectedTemplate.created_at && (
              <DetailItem label="创建时间" value={format(new Date(selectedTemplate.created_at), 'yyyy-MM-dd HH:mm')} />
            )}
          </div>
        </GlobalModal>
      )}

      {/* 删除确认对话框 */}
      <GlobalModal
        type="confirm"
        open={showDeleteConfirm}
        title="确认删除"
        children="确定要删除这个模板吗？"
        onConfirm={handleDeleteTemplate}
        onClose={() => {
          setShowDeleteConfirm(false)
        }}
        loading={deleteLoading}
        confirmText="确认删除"
        confirmDanger
      />

      {/* 新建/编辑模板弹窗 */}
      <GlobalModal
        open={showForm}
        onClose={resetForm}
        title={editingId ? '编辑模板' : '新建模板'}
        footer={
          <div className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={resetForm}>取消</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saveLoading}
            >
              {saveLoading ? '保存中...' : (editingId ? '更新' : '创建')}
            </Button>
          </div>
        }
      >
        <div className="tpl-form">
          <Input
            label="模板名称"
            placeholder="如：公司食堂午餐"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value.slice(0, 20) }))}
            autoFocus
            maxLength={20}
            required
          />
          <div className="tpl-form-row">
            <DropdownSelect
              label="类型"
              value={form.type}
              onChange={(v) => setForm(prev => ({ ...prev, type: v as 'income' | 'expense', category_id: '' }))}
              options={[
                { key: 'expense', label: '支出' },
                { key: 'income', label: '收入' },
              ]}
              placeholder="选择类型"
              required
            />
            <DropdownSelect
              label="分类"
              value={form.category_id}
              onChange={(v) => setForm(prev => ({ ...prev, category_id: v }))}
              options={categories
                .filter(c => c.type === form.type)
                .map(c => ({ key: c.id, label: `${c.icon} ${c.name}` }))}
              placeholder="选择分类"
              required
            />
          </div>
          <NumberInput
            label="金额"
            prefix="¥"
            placeholder="0.00"
            value={form.amount}
            onChange={(v) => setForm(prev => ({ ...prev, amount: v }))}
          />
          <Input
            label="备注"
            placeholder="添加备注（可选）"
            value={form.note}
            onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
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
                  onClear={() => setForm(prev => ({ ...prev, latitude: '', longitude: '', location_name: '', poi_id: '' }))}
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
                onChange={(v) => setForm(prev => ({ ...prev, sort_order: parseInt(v) || 0 }))}
                placeholder="0"
              />
            </div>
          )}
        </div>
      </GlobalModal>

      {/* 地图选点弹窗 */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={form.latitude && form.longitude ? {
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          locationName: form.location_name,
          poiId: form.poi_id,
        } : null}
      />
    </div>
  )
}

export default Templates
