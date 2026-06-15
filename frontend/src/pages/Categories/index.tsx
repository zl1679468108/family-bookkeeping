import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '../../services/categoriesApi'
import { EMOJI_PRESETS } from '../../utils/emojiPresets'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { GlobalModal, DetailItem, Space } from '../../components/ui'
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

      {/* 分类编辑/新增弹窗 */}
      <GlobalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCategory(null)
        }}
        title={modalTitle}
        footer={
          <div className="global-modal-dialog__footer-inner">
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingCategory(null)
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleModalConfirm}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? '保存中...' : '确认'}
            </Button>
          </div>
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
            required
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
      </GlobalModal>

      {/* 删除确认弹窗 */}
      <GlobalModal
        type="confirm"
        open={!!deleteTarget}
        title="确认删除"
        children={`确定删除自定义分类「${deleteTarget?.name || ''}」吗？删除后不可恢复。`}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        confirmText={deleteMutation.isPending ? '删除中...' : '确认删除'}
        loading={deleteMutation.isPending}
        confirmDanger
      />

      {/* 分类详情弹窗 */}
      {selectedCategory && (
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
            <div className="detail-icon">{selectedCategory.icon}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedCategory.name}</div>
              <div className="detail-tags">
                <span className={`detail-tag ${selectedCategory.type === 'expense' ? 'type-expense' : 'type-income'}`}>
                  {selectedCategory.type === 'expense' ? '支出' : '收入'}
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
      )}
    </div>
  )
}

export default Categories
