import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '../../services/categoriesApi'
import { EMOJI_PRESETS } from '../../utils/emojiPresets'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { DetailModal } from '../../components/DetailModal'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { IconGrid } from '../../components/ui/IconGrid'
import { SegControl } from '../../components/ui/SegControl'
import { useSort } from '../../hooks/useSort'
import type { Category, CreateCategoryInput } from '../../types/category'
import './index.scss'

// ─── 主页面组件 ──────────────────────────────────────────────────────────────

const Categories: React.FC = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

  // Modal 状态
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalIcon, setModalIcon] = useState('📌')

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
      setShowDetail(false)
      setEditingCategory(null)
      setSelectedCategory(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '已删除' })
      setDeleteTarget(null)
      setShowDetail(false)
      setSelectedCategory(null)
    },
  })

  // ── 事件处理 ────────────────────────────────────────────────────────────────

  const handleOpenAdd = useCallback(() => {
    setModalMode('add')
    setEditingCategory(null)
    setModalName('')
    setModalIcon('📌')
    setModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((cat: Category) => {
    setModalMode('edit')
    setEditingCategory(cat)
    setModalName(cat.name)
    setModalIcon(cat.icon)
    setModalOpen(true)
  }, [])

  const handleModalConfirm = useCallback(() => {
    const trimmedName = modalName.trim()
    if (!trimmedName || !modalIcon) return

    if (modalMode === 'add') {
      createMutation.mutate({ name: trimmedName, icon: modalIcon, type: activeTab })
    } else if (modalMode === 'edit' && editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: trimmedName, icon: modalIcon })
    }
  }, [modalMode, modalName, modalIcon, editingCategory, activeTab, createMutation, updateMutation])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id)
    }
  }, [deleteTarget, deleteMutation])

  const typeLabel = activeTab === 'expense' ? '支出' : '收入'
  const modalTitle = modalMode === 'add' ? `新增${typeLabel}分类` : `编辑${typeLabel}分类`

  const iconOptions = React.useMemo(
    () => EMOJI_PRESETS.map((emoji) => ({ value: emoji, icon: emoji })),
    [],
  )

  // ── 渲染 ───────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      <Card>
        {isLoading || !customCategories ? (
          <>
            <CardHeader
              title={<Skeleton width="80px" height="14px" />}
              action={<Skeleton width="90px" height="24px" borderRadius="6px" />}
            />
            <div style={{ opacity: 0.6 }}>
              <SegControl
                options={[
                  { value: 'expense', label: <Skeleton width="70px" height="14px" /> },
                  { value: 'income', label: <Skeleton width="70px" height="14px" /> },
                ]}
                value="expense"
                onChange={() => {}}
              />
            </div>
            <div className="cat-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="cat-card" style={{ pointerEvents: 'none' }}>
                  <div className="cat-header">
                    <div className="cat-e">
                      <Skeleton width="16px" height="16px" borderRadius="4px" />
                    </div>
                    <div className="cat-content">
                      <div className="cat-n">
                        <Skeleton width="70%" height="13px" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <CardHeader
              title="分类管理"
              action={
                <div className="cat-header-actions">
                  <Button
                    variant={sortingMode ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      if (sortingMode) {
                        handleSaveSort()
                        notify({ type: 'success', message: '排序已保存' })
                      } else {
                        handleEnterSortMode()
                      }
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? '保存中...' : (sortingMode ? '完成排序' : '编辑排序')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                    + 新建分类
                  </Button>
                </div>
              }
            />

            {/* Tab 切换 */}
            <SegControl
              options={[
                { value: 'expense', label: '支出分类' },
                { value: 'income', label: '收入分类' },
              ]}
              value={activeTab}
              onChange={(v) => {
                if (sortingMode) {
                  handleCancelSort()
                }
                setActiveTab(v)
              }}
            />

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
                    onClick={() => {
                      if (!sortingMode) {
                        setSelectedCategory(cat)
                        setShowDetail(true)
                      }
                    }}
                    style={{ cursor: sortingMode ? 'grab' : 'pointer' }}
                  >
                    <span className="cat-handle">⋮⋮</span>
                    <div className="cat-header">
                      <span className="cat-e">{cat.icon}</span>
                      <div className="cat-content">
                        <div className="cat-n">{cat.name}</div>
                      </div>
                    </div>
                    <div className="cat-badges">
                      {cat.is_default && <span className="cat-badge-default">默认</span>}
                      {!cat.is_default && <span className="cat-badge-custom">自定义</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* 分类编辑/新增弹窗 - 使用通用Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCategory(null)
        }}
        title={modalTitle}
        footer={
          <ModalFooter
            onCancel={() => {
              setModalOpen(false)
              setEditingCategory(null)
            }}
            onConfirm={handleModalConfirm}
            confirmText={createMutation.isPending || updateMutation.isPending ? '保存中...' : '确认'}
            confirmLoading={createMutation.isPending || updateMutation.isPending}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="名称"
            placeholder="输入分类名称"
            maxLength={10}
            value={modalName}
            onChange={(e) => setModalName(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--muted)' }}>图标</label>
            <IconGrid
              options={iconOptions}
              value={modalIcon}
              onChange={setModalIcon}
            />
          </div>
        </div>
      </Modal>

      {/* 删除确认弹窗 - 使用通用Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        footer={
          <ModalFooter
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
            confirmText={deleteMutation.isPending ? '删除中...' : '确认删除'}
            confirmLoading={deleteMutation.isPending}
            confirmDanger
          />
        }
      >
        <p>确定删除自定义分类「{deleteTarget?.name || ''}」吗？删除后不可恢复。</p>
      </Modal>

      {/* 分类详情弹窗 */}
      {selectedCategory && (
        <DetailModal
          visible={showDetail}
          onClose={() => {
            setShowDetail(false)
            setSelectedCategory(null)
          }}
          title="分类详情"
          footer={
            <>
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
            </>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{selectedCategory.icon}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedCategory.name}</div>
              <div className="detail-subtitle">
                {selectedCategory.type === 'expense' ? '支出' : '收入'}分类 ·{' '}
                {selectedCategory.is_default ? '系统默认' : '自定义'}
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
