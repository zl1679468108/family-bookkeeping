import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '../../services/categoriesApi'
import { EMOJI_PRESETS } from '../../utils/emojiPresets'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { notify } from '../../utils/notifications'
import { Skeleton, CardGridSkeleton } from '../../components/ui/Skeleton'
import { DetailModal } from '../../components/DetailModal'
import { IconPicker } from '../../components/IconPicker'
import { useSort } from '../../hooks/useSort'
import type { Category, CreateCategoryInput } from '../../types/category'

// ─── Modal 组件 ──────────────────────────────────────────────────────────────

interface CategoryModalProps {
  open: boolean
  mode: 'add' | 'edit'
  type: 'expense' | 'income'
  initialName?: string
  initialIcon?: string
  onConfirm: (name: string, icon: string) => void
  onClose: () => void
  loading?: boolean
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  mode,
  type,
  initialName = '',
  initialIcon = '📌',
  onConfirm,
  onClose,
  loading = false,
}) => {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)

  React.useEffect(() => {
    if (open) {
      setName(initialName)
      setIcon(initialIcon)
    }
  }, [open, initialName, initialIcon])

  if (!open) return null

  const isValid = name.trim().length > 0 && icon.length > 0

  const handleSubmit = () => {
    if (!isValid || loading) return
    onConfirm(name.trim(), icon)
  }

  const typeLabel = type === 'expense' ? '支出' : '收入'

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{mode === 'add' ? `新增${typeLabel}分类` : `编辑${typeLabel}分类`}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* 名称 */}
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入分类名称"
              maxLength={10}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* 图标 */}
          <div className="form-group">
            <label>图标</label>
            <IconPicker
              value={icon}
              onChange={setIcon}
              icons={EMOJI_PRESETS}
              label=""
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? '保存中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 删除确认弹窗 ────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  open: boolean
  categoryName: string
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  categoryName,
  onConfirm,
  onClose,
  loading = false,
}) => {
  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>确认删除</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>确定删除自定义分类「{categoryName}」吗？删除后不可恢复。</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>取消</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 主页面组件 ──────────────────────────────────────────────────────────────

const Categories: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

  // Modal 状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // 删除确认状态
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // 详情弹窗状态
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // ── 查询 ──────────────────────────────────────────────────────────────────

  const { data: customCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const filteredCategories = React.useMemo(
    () => (customCategories || []).filter((c) => c.type === activeTab).sort((a, b) => a.sort_order - b.sort_order),
    [customCategories, activeTab],
  )

  // 使用可复用排序 Hooks（支出和收入分类都启用排序）
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
  } = useSort(['categories'], filteredCategories, reorderCategories)

  // ─ 变更 ───────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '分类已创建' })
      setModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name, icon }: { id: string; name: string; icon: string }) =>
      updateCategory(id, { name, icon }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '分类已更新' })
      setModalOpen(false)
      setEditingCategory(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '已删除' })
      setDeleteTarget(null)
    },
  })

  // ── 事件处理 ────────────────────────────────────────────────────────────────

  const handleOpenAdd = useCallback(() => {
    setModalMode('add')
    setEditingCategory(null)
    setModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((cat: Category) => {
    setModalMode('edit')
    setEditingCategory(cat)
    setModalOpen(true)
  }, [])

  const handleModalConfirm = useCallback(
    (name: string, icon: string) => {
      if (modalMode === 'add') {
        createMutation.mutate({ name, icon, type: activeTab })
      } else if (modalMode === 'edit' && editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, name, icon })
      }
    },
    [modalMode, editingCategory, activeTab, createMutation, updateMutation],
  )

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }, [deleteTarget, deleteMutation])

  // ── 渲染 ───────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      <div className="dash-card">
        {isLoading || !customCategories ? (
          <>
            <div className="card-header">
              <Skeleton width="80px" height="14px" />
              <Skeleton width="90px" height="24px" borderRadius="6px" />
            </div>
            <div className="seg-control" style={{ opacity: 0.7 }}>
              <Skeleton width="80px" height="28px" borderRadius="6px" />
              <Skeleton width="80px" height="28px" borderRadius="6px" />
            </div>
            <div className="cat-grid">
              <CardGridSkeleton count={4} columns={6} />
            </div>
          </>
        ) : (
          <>
            <div className="card-header">
              <h3>分类管理</h3>
              <button
                className={`btn btn-sm ${sortingMode ? 'btn-outline' : 'btn-secondary'}`}
                onClick={() => {
                  if (sortingMode) {
                    handleSaveSort();
                    notify({ type: 'success', message: '排序已保存' });
                  } else {
                    handleEnterSortMode();
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : (sortingMode ? '完成排序' : '编辑排序')}
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="seg-control">
              <button
                className={`seg-opt ${activeTab === 'expense' ? 'active' : ''}`}
                onClick={() => {
                  if (sortingMode) {
                    handleCancelSort()
                  }
                  setActiveTab('expense')
                }}
              >
                支出分类
              </button>
              <button
                className={`seg-opt ${activeTab === 'income' ? 'active' : ''}`}
                onClick={() => {
                  if (sortingMode) {
                    handleCancelSort()
                  }
                  setActiveTab('income')
                }}
              >
                收入分类
              </button>
            </div>

            {/* 分类列表 */}
            <div className={`cat-grid${sortingMode ? ' sort-mode' : ''}`}>
            {orderedList.map((cat, idx) => {
              const isDragging = dragIndex === idx
              return (
                <div
                  key={cat.id}
                  className={`cat-card${isDragging ? ' dragging' : ''}`}
                  draggable={sortingMode}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onClick={() => { if (!sortingMode) { setSelectedCategory(cat); setShowDetail(true); } }}
                  style={{ cursor: sortingMode ? 'grab' : 'pointer' }}
                >
                  {/* 拖拽手柄 */}
                  <span className="cat-handle">⋮⋮</span>
                  {/* 右上角标签 */}
                  <div className="cat-badges">
                    {cat.is_default && (
                      <span className="cat-badge-default">默认</span>
                    )}
                    {!cat.is_default && (
                      <span className="cat-badge-custom">自定义</span>
                    )}
                  </div>
                  <div className="cat-header">
                    <span className="cat-e">{cat.icon}</span>
                    <div className="cat-content">
                      <div className="cat-n">{cat.name}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* 网格式新增入口 */}
            <div className="cat-card add-new" onClick={() => { handleOpenAdd() }}>
              <span className="add-icon">+</span>
              <span className="add-text">新建</span>
            </div>
          </div>
          </>
        )}
      </div>

      {/* 分类编辑/新增弹窗 */}
      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        type={activeTab}
        initialName={editingCategory?.name || ''}
        initialIcon={editingCategory?.icon || '📌'}
        onConfirm={handleModalConfirm}
        onClose={() => { setModalOpen(false); setEditingCategory(null) }}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        categoryName={deleteTarget?.name || ''}
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteTarget(null)
          // 不关闭详情弹窗
        }}
        loading={deleteMutation.isPending}
      />

      {/* 分类详情弹窗 */}
      {selectedCategory && (
        <DetailModal
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          title="分类详情"
          footer={
            <>
              {!selectedCategory.is_default && (
                <button
                  className="btn btn-secondary"
                  onClick={() => { handleOpenEdit(selectedCategory); setShowDetail(false) }}
                >
                  编辑
                </button>
              )}
              {!selectedCategory.is_default && (
                <button
                  className="btn btn-danger"
                  onClick={() => { setDeleteTarget(selectedCategory); }}
                >
                  删除
                </button>
              )}
            </>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{selectedCategory.icon}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedCategory.name}</div>
              <div className="detail-subtitle">
                {selectedCategory.type === 'expense' ? '支出' : '收入'}分类 · {selectedCategory.is_default ? '系统默认' : '自定义'}
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-item-label">分类 ID</span>
                  <span className="detail-item-value">{selectedCategory.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">排序</span>
                  <span className="detail-item-value">第 {selectedCategory.sort_order + 1} 位</span>
                </div>
                {selectedCategory.created_at && (
                  <div className="detail-item">
                    <span className="detail-item-label">创建时间</span>
                    <span className="detail-item-value">
                      {format(new Date(selectedCategory.created_at), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                )}
                {selectedCategory.updated_at && (
                  <div className="detail-item">
                    <span className="detail-item-label">更新时间</span>
                    <span className="detail-item-value">
                      {format(new Date(selectedCategory.updated_at), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  )
}

export default Categories
