import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { Button } from '../components/ui/button'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/categoriesApi'
import { expenseCategoryDict, incomeCategoryDict } from '../utils/commonDic'
import { EMOJI_PRESETS } from '../utils/emojiPresets'
import { notify } from '../utils/notifications'
import type { Category, CreateCategoryInput } from '../types/category'

/** 默认分类 id 集合，用于判断是否可操作 */
const DEFAULT_EXPENSE_IDS = Object.keys(expenseCategoryDict)
const DEFAULT_INCOME_IDS = Object.keys(incomeCategoryDict)

/** 将默认分类 + 自定义分类合并为统一列表 */
function mergeCategories(
  customCategories: Category[],
  type: 'expense' | 'income',
): Category[] {
  const dict = type === 'expense' ? expenseCategoryDict : incomeCategoryDict
  const defaults: Category[] = Object.entries(dict).map(([key, val]) => ({
    id: key,
    name: val.name,
    icon: val.icon,
    type,
    sort_order: 0,
    isDefault: true,
  }))
  return [...defaults, ...customCategories.filter((c) => c.type === type)]
}

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
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all ${
                  icon === emoji
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

  const mergedCategories = mergeCategories(customCategories, activeTab)
  const defaultIds = activeTab === 'expense' ? DEFAULT_EXPENSE_IDS : DEFAULT_INCOME_IDS
  const isDefaultCategory = (cat: Category): boolean =>
    cat.isDefault === true || defaultIds.includes(cat.id)

  // ── 变更 ───────────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '分类已创建' })
      setModalOpen(false)
    },
    onError: (error: Error) => {
      notify({ type: 'error', message: `创建失败: ${error.message}` })
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
    onError: (error: Error) => {
      notify({ type: 'error', message: `更新失败: ${error.message}` })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      notify({ type: 'success', message: '已删除' })
      setDeleteTarget(null)
    },
    onError: (error: Error) => {
      notify({ type: 'error', message: `删除失败: ${error.message}` })
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

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // ── 渲染 ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <Header title="分类管理">
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
      </Header>

      {/* Tab 切换 */}
      <div className="mx-auto mt-5 flex max-w-lg gap-1 rounded-xl bg-slate-100 p-1">
        <button
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'expense'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('expense')}
        >
          支出分类
        </button>
        <button
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === 'income'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('income')}
        >
          收入分类
        </button>
      </div>

      {/* 分类列表 */}
      <div className="mx-auto mt-5 max-w-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : mergedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <svg className="mb-3 h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">暂无分类数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mergedCategories.map((cat) => {
              const isDefault = isDefaultCategory(cat)
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-xl">
                      {cat.icon}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 编辑按钮 */}
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isDefault
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`}
                      onClick={() => (isDefault ? undefined : handleOpenEdit(cat))}
                      disabled={isDefault}
                      title={isDefault ? '默认分类不可操作' : '编辑'}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>

                    {/* 删除按钮 */}
                    <button
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isDefault
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                      }`}
                      onClick={() => (isDefault ? undefined : setDeleteTarget(cat))}
                      disabled={isDefault}
                      title={isDefault ? '默认分类不可操作' : '删除'}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
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
