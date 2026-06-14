import React, { useState } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, reorderTemplates } from '../../services/templatesApi'
import { useCategories } from '../../hooks/useCategories'
import { formatAmount } from '../../utils/common'
import { notify } from '../../utils/notifications'
import { Skeleton, CardGridSkeleton } from '../../components/ui/Skeleton'
import { DetailModal } from '../../components/DetailModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { LocationPicker } from '../AddTransaction/components/LocationPicker'
import { useSort } from '../../hooks/useSort'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import type { CreateTemplateInput } from '../../types/template'
import type { LocationResult } from '../../types/map'

const Templates: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { run: handleDeleteTemplate, isRunning: deleteLoading } = useDebouncedAction(async () => {
    deleteTemplate(selectedTemplate.id)
    queryClient.invalidateQueries({ queryKey: ['templates'] })
    setShowDetail(false)
    setShowDeleteConfirm(false)
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
    handleCancelSort,
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
                      <Skeleton width="16px" height="16px" borderRadius="4px" />
                    </div>
                    <div className="tpl-n">
                      <Skeleton width="80%" height="13px" />
                    </div>
                  </div>
                  <div className="tpl-content">
                    <div className="tpl-meta">
                      <Skeleton width="30%" height="11px" />
                      <Skeleton width="40%" height="11px" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="card-header">
              <h3>交易模板</h3>
              <button
                className={`btn btn-sm ${sortingMode ? 'btn-outline' : 'btn-secondary'}`}
                onClick={sortingMode ? handleSaveSort : handleEnterSortMode}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : (sortingMode ? '完成排序' : '编辑排序')}
              </button>
            </div>

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
                    <div className="tpl-e">{cat.icon}</div>
                    <div className="tpl-n">{t.name}</div>
                  </div>
                  <div className="tpl-content">
                    <div className="tpl-meta">
                      <span className="tpl-type">{t.type === 'expense' ? '支出' : '收入'}</span>
                      <span className="tpl-cat">{cat.name}</span>
                      {t.amount && <span className="tpl-amt">{formatAmount(t.amount)}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            {/* 网格式新增入口 */}
            <div className="tpl-card add-new" onClick={() => { resetForm(); setShowForm(true) }}>
              <span className="add-icon">+</span>
              <span className="add-text">新建</span>
            </div>
          </div>
          </>
        )}
      </div>

      {/* 模板详情弹窗 */}
      {selectedTemplate && (
        <DetailModal
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          title="模板详情"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { handleEdit(selectedTemplate); setShowDetail(false) }}>
                编辑
              </button>
              <button className="btn btn-secondary" onClick={() => { handleCopy(selectedTemplate); setShowDetail(false) }}>
                复制
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除
              </button>
            </>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{getCategoryInfo(selectedTemplate.category_id).icon}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedTemplate.name}</div>
              <div className="detail-subtitle">
                {selectedTemplate.type === 'expense' ? '支出' : '收入'}
                {selectedTemplate.amount && (
                  <span className="detail-amount-inline">
                    {' '}· ¥{selectedTemplate.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {' · '}
                {getCategoryInfo(selectedTemplate.category_id).icon} {getCategoryInfo(selectedTemplate.category_id).name}
              </div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            {selectedTemplate.note && (
              <div className="detail-item">
                <span className="detail-item-label">备注</span>
                <span className="detail-item-value">{selectedTemplate.note}</span>
              </div>
            )}
            {selectedTemplate.latitude && selectedTemplate.longitude && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-item-label">位置</span>
                <span className="detail-item-value">
                  {selectedTemplate.latitude}, {selectedTemplate.longitude}
                </span>
              </div>
            )}
            {selectedTemplate.location_name && (
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="detail-item-label">地址</span>
                <span className="detail-item-value">{selectedTemplate.location_name}</span>
              </div>
            )}
            {selectedTemplate.poi_id && (
              <div className="detail-item">
                <span className="detail-item-label">商户 ID</span>
                <span className="detail-item-value">{selectedTemplate.poi_id}</span>
              </div>
            )}
            {selectedTemplate.merchant_name && (
              <div className="detail-item">
                <span className="detail-item-label">商户名称</span>
                <span className="detail-item-value merchant-name-truncate" title={selectedTemplate.merchant_name}>
                  {selectedTemplate.merchant_name}
                </span>
              </div>
            )}
            {selectedTemplate.book_id && (
              <div className="detail-item">
                <span className="detail-item-label">账本 ID</span>
                <span className="detail-item-value">{selectedTemplate.book_id}</span>
              </div>
            )}
            {selectedTemplate.sort_order !== undefined && (
              <div className="detail-item">
                <span className="detail-item-label">排序</span>
                <span className="detail-item-value">第 {selectedTemplate.sort_order + 1} 位</span>
              </div>
            )}
            {selectedTemplate.created_at && (
              <div className="detail-item">
                <span className="detail-item-label">创建时间</span>
                <span className="detail-item-value">{format(new Date(selectedTemplate.created_at), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            )}
          </div>
        </DetailModal>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这个模板吗？"
        onConfirm={handleDeleteTemplate}
        onCancel={() => {
          setShowDeleteConfirm(false)
        }}
        loading={deleteLoading}
      />

      {/* 新建/编辑模板弹窗 */}
      {showForm && (
        <div className="book-modal-overlay" onClick={resetForm}>
          <div className="book-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="book-modal-dialog__header">
              <h3 className="book-modal-dialog__title">{editingId ? '编辑模板' : '新建模板'}</h3>
              <button className="book-modal-dialog__close" onClick={resetForm}>✕</button>
            </div>
            <div className="book-modal-dialog__body">
              <div className="book-modal-field">
                <label className="book-modal-field__label">模板名称</label>
                <input
                  className="book-modal-field__input"
                  placeholder="如：公司食堂午餐"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value.slice(0, 20) }))}
                  autoFocus
                  maxLength={20}
                />
              </div>
              <div className="book-modal-field-row">
                <div className="book-modal-field">
                  <label className="book-modal-field__label">类型</label>
                  <select
                    className="book-modal-field__input"
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'income' | 'expense', category_id: '' }))}
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                </div>
                <div className="book-modal-field">
                  <label className="book-modal-field__label">分类</label>
                  <select
                    className="book-modal-field__input"
                    value={form.category_id}
                    onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">选择分类</option>
                    {categories
                      .filter(c => c.type === form.type)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="book-modal-field">
                <label className="book-modal-field__label">金额</label>
                <input
                  className="book-modal-field__input"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value.replace(/[^0-9.]/g, '') }))}
                />
              </div>
              <div className="book-modal-field">
                <label className="book-modal-field__label">备注</label>
                <input
                  className="book-modal-field__input"
                  placeholder="添加备注（可选）"
                  value={form.note}
                  onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
              <div className="book-modal-field">
                <label className="book-modal-field__label">位置信息</label>
                <div className="location-select-wrapper">
                  <button
                    type="button"
                    className="book-modal-btn book-modal-btn--secondary"
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={() => setShowLocationPicker(true)}
                  >
                    📍 选择位置
                  </button>
                  {form.location_name && (
                    <div className="location-selected-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--fg2)' }}>
                      <span style={{ color: 'var(--pr)' }}>✓</span>
                      <span>{form.location_name}</span>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--fg3)', cursor: 'pointer', padding: '0 4px' }}
                        onClick={() => setForm(prev => ({ ...prev, latitude: '', longitude: '', location_name: '', poi_id: '' }))}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="book-modal-field-row">
                <div className="book-modal-field">
                  <label className="book-modal-field__label">商户 ID</label>
                  <input
                    className="book-modal-field__input"
                    value={form.poi_id}
                    disabled
                    readOnly
                  />
                </div>
                <div className="book-modal-field">
                  <label className="book-modal-field__label">排序</label>
                  <input
                    className="book-modal-field__input"
                    type="number"
                    placeholder="0"
                    value={form.sort_order}
                    onChange={(e) => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
            <div className="book-modal-dialog__footer">
              <button type="button" className="book-modal-btn book-modal-btn--secondary" onClick={resetForm}>取消</button>
              <button
                type="button"
                className="book-modal-btn book-modal-btn--primary"
                onClick={handleSave}
                disabled={saveLoading || !form.name.trim() || !form.category_id}
              >
                {saveLoading ? '保存中...' : (editingId ? '更新' : '创建')}
              </button>
            </div>
          </div>
        </div>
      )}

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
