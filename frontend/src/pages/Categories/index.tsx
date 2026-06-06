import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../../components/Header'
import { Button } from '../../components/ui/button'
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from '../../services/categoriesApi'
import { EMOJI_PRESETS } from '../../utils/emojiPresets'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import './index.scss'
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
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  mode,
  type,
  initialName = '',
  initialIcon = '📌',
  onConfirm,
  onClose,
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
    if (!isValid) return
    onConfirm(name.trim(), icon)
  }

  const typeLabel = type === 'expense' ? '支出' : '收入'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <h2 className="mb-5 text-lg font-semibold text-slate-800">
          {mode === 'add' ? `新增${typeLabel}分类` : `编辑${typeLabel}分类`}
        </h2>

        {/* 名称 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary"
            placeholder="输入分类名称"
            maxLength={10}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <p className="mt-1 text-xs text-slate-400">{name.length}/10</p>
        </div>

        {/* 图标 */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            图标 <span className="text-red-400">*</span>
          </label>
          <div className="grid max-h-[200px] grid-cols-8 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all ${icon === emoji
                  ? 'bg-primary/15 ring-2 ring-primary scale-110'
                  : 'hover:bg-white hover:shadow-sm'
                  }`}
                onClick={() => setIcon(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!isValid}>
            确认
          </Button>
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
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  categoryName,
  onConfirm,
  onClose,
}) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-semibold text-slate-800">确认删除</h2>
        <p className="mb-5 text-sm text-slate-500">
          确定删除自定义分类「{categoryName}」吗？删除后不可恢复。
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            确认删除
          </Button>
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

  // ── 查询 ───────────────────────────────────────────────────────────────────

  const { data: customCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
  })

  // 直接使用 API 数据（已包含默认 + 自定义），memoized 防止无限循环
  const filteredCategories = React.useMemo(
    () => (customCategories || []).filter((c) => c.type === activeTab),
    [customCategories, activeTab],
  )
  const isDefaultCategory = (cat: Category): boolean =>
    cat.is_default === true

  // ── 变更 ───────────────────────────────────────────────────────────────────

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

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; sort_order: number }[]) => reorderCategories(orders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '排序已保存' })
    },
  })

  // 排序模式状态
  const [sortingMode, setSortingMode] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [orderedList, setOrderedList] = useState<Category[]>([])
  const [originalList, setOriginalList] = useState<Category[]>([])

  // 同步 filteredCategories → orderedList（仅在非排序模式下，且数据真正变化时同步）
  const prevCategoriesRef = React.useRef<string>('')
  React.useEffect(() => {
    if (sortingMode) return
    // 仅当分类 ID 序列变化时才更新，避免无限循环
    const key = filteredCategories.map((c) => c.id).join(',')
    if (key !== prevCategoriesRef.current) {
      prevCategoriesRef.current = key
      setOrderedList(filteredCategories)
    }
  }, [filteredCategories, sortingMode])

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

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ── 排序模式切换 ──────────────────────────────────────────────────────────────

  const handleEnterSortMode = useCallback(() => {
    setOriginalList([...orderedList])
    setSortingMode(true)
  }, [orderedList])

  const handleSaveSort = useCallback(() => {
    const orders = orderedList.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx,
    }))
    reorderMutation.mutate(orders)
    setSortingMode(false)
  }, [orderedList, reorderMutation])

  const handleCancelSort = useCallback(() => {
    setOrderedList(originalList)
    setSortingMode(false)
    setDragIndex(null)
  }, [originalList])

  // ── 拖拽排序（仅在排序模式下生效）──────────────────────────────────────────────

  const handleDragStart = (index: number) => {
    if (!sortingMode) return
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!sortingMode) return
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const reordered = [...orderedList]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    setOrderedList(reordered)
    setDragIndex(index)
  }

  const handleDrop = () => {
    if (!sortingMode) return
    setDragIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  // ── 渲染 ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <Header title="分类管理">
        {sortingMode ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancelSort}>
              取消
            </Button>
            <Button
              onClick={handleSaveSort}
              disabled={reorderMutation.isPending}
            >
              {reorderMutation.isPending ? '保存中...' : '完成排序'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleEnterSortMode}
              disabled={isMutating || filteredCategories.length === 0}
            >
              <svg className="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              编辑排序
            </Button>
            <Button onClick={handleOpenAdd} disabled={isMutating}>
              <svg className="mr-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              新增分类
            </Button>
          </div>
        )}
      </Header>

      {/* Tab 切换 */}
      <div className="mx-auto mt-5 flex max-w-lg gap-1 rounded-xl bg-slate-100 p-1">
        <button
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'expense'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
          onClick={() => {
            if (sortingMode) {
              setOrderedList(originalList)
              setSortingMode(false)
              setDragIndex(null)
            }
            setActiveTab('expense')
          }}
        >
          支出分类
        </button>
        <button
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${activeTab === 'income'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
            }`}
          onClick={() => {
            if (sortingMode) {
              setOrderedList(originalList)
              setSortingMode(false)
              setDragIndex(null)
            }
            setActiveTab('income')
          }}
        >
          收入分类
        </button>
      </div>

      {/* 分类列表 */}
      <div className="mx-auto mt-5">
        {sortingMode && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            拖拽分类卡片可调整排序，调整完成后点击「完成排序」保存
          </div>
        )}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', padding: '8px 0' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px', borderRadius: '10px', background: '#fff' }}>
                <Skeleton width="40px" height="40px" borderRadius="10px" />
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <Skeleton width="60%" height="15px" marginBottom="6px" />
                  <Skeleton width="40%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        ) : orderedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="mb-3 h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">暂无分类数据</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {orderedList.map((cat, idx) => {
              const isDefault = isDefaultCategory(cat)
              const isDragging = dragIndex === idx
              return (
                <div
                  key={cat.id}
                  draggable={sortingMode}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`category-card ${sortingMode ? 'category-card--sortable' : ''} ${isDragging ? 'category-card--dragging' : ''}`}
                  style={{ width: '160px', position: 'relative' }}
                >
                  {/* 默认标签 */}
                  {isDefault && (
                    <span className="absolute top-1 right-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                      默认
                    </span>
                  )}

                  {/* 排序模式下显示拖拽手柄 */}
                  {sortingMode && (
                    <span className="absolute top-1 left-1 text-xs text-slate-300">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                    </span>
                  )}

                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-2xl mb-2">
                    {cat.icon}
                  </span>
                  <span className="text-sm font-medium text-slate-700 text-center">
                    {cat.name}
                  </span>

                  {/* 非排序模式显示编辑/删除按钮 */}
                  {!sortingMode && !isDefault && (
                    <div className="flex items-center gap-1 mt-3">
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        onClick={() => handleOpenEdit(cat)}
                        title="编辑"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        onClick={() => setDeleteTarget(cat)}
                        title="删除"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* 排序模式下的标签 */}
                  {sortingMode && !isDefault && (
                    <span className="mt-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                      可拖拽
                    </span>
                  )}
                </div>
              )
            })}

            {/* 自定义分类为空时提示 */}
            {customCategories.filter((c) => c.type === activeTab).length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                <p className="text-xs text-slate-400">暂无自定义分类，点击右上角「新增分类」添加</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新增/编辑 Modal */}
      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        type={activeTab}
        initialName={editingCategory?.name}
        initialIcon={editingCategory?.icon}
        onConfirm={handleModalConfirm}
        onClose={() => {
          setModalOpen(false)
          setEditingCategory(null)
        }}
      />

      {/* 删除确认 Modal */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        categoryName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Categories
