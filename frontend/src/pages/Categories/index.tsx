import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '../../services/categoriesApi'
import { fetchCustomIcons, uploadIcon, deleteIcon } from '../../services/iconsApi'
import { EMOJI_PRESETS } from '../../utils/emojiPresets'
import { SHOPPING_PLATFORM_ICONS, getPlatformIconByKey } from '../../utils/shoppingPlatformIcons'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { GlobalModal, DetailItem, Space } from '../../components/ui'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { IconGrid } from '../../components/ui/IconGrid'
import type { CustomIconItem } from '../../components/ui/IconGrid'
import { SegControl } from '../../components/ui/SegControl'
import { useSort } from '../../hooks/useSort'
import { useCategories } from '../../hooks/useCategories'
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

  const { data: customCategories = [], isLoading } = useCategories() as any

  // 获取分类自定义图标
  const { data: customIcons = [], refetch: refetchIcons } = useQuery({
    queryKey: ['customIcons', 'category'],
    queryFn: () => fetchCustomIcons('category'),
    staleTime: 5 * 60 * 1000,
  })

  const filteredCategories = React.useMemo(
    () => (customCategories || []).filter((c: Category) => c.type === activeTab).sort((a: Category, b: Category) => a.sort_order - b.sort_order),
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
  } = useSort<Category>(['categories'], filteredCategories, reorderCategories) as {
    sortingMode: boolean
    dragIndex: number | null
    orderedList: Category[]
    handleEnterSortMode: () => void
    handleSaveSort: () => void
    handleCancelSort: () => void
    handleDragStart: (index: number) => void
    handleDragOver: (e: React.DragEvent, index: number) => void
    handleDrop: (e: React.DragEvent) => void
    handleDragEnd: () => void
    isSaving: boolean
  }

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
    mutationFn: ({ id, name, icon, icon_id }: { id: string; name: string; icon?: string; icon_id?: string }) =>
      updateCategory(id, { name, icon, icon_id }),
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

    // 判断是否是自定义图标（通过长度判断，UUID 是 36 位）
    const isCustomIcon = modalIcon.length === 36 && modalIcon.includes('-')

    if (modalMode === 'add') {
      if (isCustomIcon) {
        createMutation.mutate({ name: trimmedName, icon_id: modalIcon, type: activeTab })
      } else {
        createMutation.mutate({ name: trimmedName, icon: modalIcon, type: activeTab })
      }
    } else if (modalMode === 'edit' && editingCategory) {
      if (isCustomIcon) {
        updateMutation.mutate({ id: editingCategory.id, name: trimmedName, icon_id: modalIcon })
      } else {
        updateMutation.mutate({ id: editingCategory.id, name: trimmedName, icon: modalIcon })
      }
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
    () => [
      // emoji 预设
      ...EMOJI_PRESETS.map((emoji) => ({ value: emoji, icon: emoji as React.ReactNode })),
      // 购物平台 SVG 预设
      ...SHOPPING_PLATFORM_ICONS.map((item) => ({
        value: `platform_${item.key}`,
        icon: getPlatformIconByKey(item.key) as React.ReactNode,
        label: item.label,
      })),
    ],
    [],
  )

  // 自定义图标列表（转换为 CustomIconItem 格式）
  const customIconItems: CustomIconItem[] = React.useMemo(
    () => (customIcons || []).map((ci) => ({
      id: ci.id,
      icon_url: ci.icon_url,
      icon_type: ci.icon_type,
    })),
    [customIcons],
  )

  // 上传图标处理
  const handleIconUpload = useCallback(async (file: File, iconType: 'category' | 'book') => {
    await uploadIcon(file, iconType)
    refetchIcons()
    notify({ type: 'success', message: '图标上传成功' })
  }, [refetchIcons])

  // 删除图标处理
  const handleIconDelete = useCallback(async (iconId: string) => {
    await deleteIcon(iconId)
    refetchIcons()
    notify({ type: 'success', message: '图标已删除' })
  }, [refetchIcons])

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
                      <span className="cat-e">{renderCategoryIcon(cat.icon, { size: 18 })}</span>
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
              customIcons={customIconItems}
              onUpload={handleIconUpload}
              onDelete={handleIconDelete}
              iconType="category"
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
            <div className="detail-icon">{renderCategoryIcon(selectedCategory.icon, { size: 40 })}</div>
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
