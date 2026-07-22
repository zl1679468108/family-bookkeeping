import React, { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategory, updateCategory, deleteCategory, reorderCategories } from '../../../services/categoriesApi'
import { fetchCustomIcons, uploadIcon, deleteIcon } from '../../../services/iconsApi'
import { EMOJI_PRESETS } from '../../../utils/emojiPresets'
import { SHOPPING_PLATFORM_ICONS, getPlatformIconByKey } from '../../../utils/shoppingPlatformIcons'
import { notify } from '../../../utils/notifications'
import { useSort } from '../../../hooks/useSort'
import { useCategories } from '../../../hooks/useCategories'
import { useMutationAction } from '../../../hooks/useMutationAction'
import type { Category, CreateCategoryInput } from '../../../types/category'
import type { CustomIconItem } from '../../../components/ui/IconGrid'

export function useCategoriesPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [modalName, setModalName] = useState('')
  const [modalIcon, setModalIcon] = useState('📌')

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // Detail modal state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // Queries
  const { data: customCategories = [], isLoading } = useCategories()
  const { data: customIcons = [], refetch: refetchIcons } = useQuery({
    queryKey: ['customIcons', 'category'],
    queryFn: () => fetchCustomIcons('category'),
    staleTime: 5 * 60 * 1000,
  })

  const filteredCategories = React.useMemo(
    () => (customCategories || []).filter((c: Category) => c.type === activeTab).sort((a: Category, b: Category) => a.sort_order - b.sort_order),
    [customCategories, activeTab],
  )

  // Sorting hook
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

  // Mutations — 使用 useMutationAction 统一防抖 + loading 状态
  const createMutation = useMutationAction(
    (input: CreateCategoryInput) => createCategory(input),
    {
      invalidateKeys: [['categories']],
      successMessage: '分类已创建',
      errorMessage: '创建失败',
      onSuccess: () => setModalOpen(false),
    },
  )

  const updateMutation = useMutationAction(
    ({ id, name, icon, icon_id }: { id: string; name: string; icon?: string; icon_id?: string }) =>
      updateCategory(id, { name, icon, icon_id }),
    {
      invalidateKeys: [['categories']],
      successMessage: '分类已更新',
      errorMessage: '更新失败',
      onSuccess: () => {
        setModalOpen(false)
        setShowDetail(false)
        setEditingCategory(null)
        setSelectedCategory(null)
      },
    },
  )

  const deleteMutation = useMutationAction(
    (id: string) => deleteCategory(id),
    {
      invalidateKeys: [['categories']],
      successMessage: '已删除',
      errorMessage: '删除失败',
      onSuccess: () => {
        setDeleteTarget(null)
        setShowDetail(false)
        setSelectedCategory(null)
      },
    },
  )

  // Event handlers
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

  const handleModalConfirm = useCallback(async () => {
    const trimmedName = modalName.trim()
    if (!trimmedName || !modalIcon) return

    // Check if custom icon (UUID length is 36)
    const isCustomIcon = modalIcon.length === 36 && modalIcon.includes('-')

    if (modalMode === 'add') {
      if (isCustomIcon) {
        await createMutation.run({ name: trimmedName, icon_id: modalIcon, type: activeTab })
      } else {
        await createMutation.run({ name: trimmedName, icon: modalIcon, type: activeTab })
      }
    } else if (modalMode === 'edit' && editingCategory) {
      if (isCustomIcon) {
        await updateMutation.run({ id: editingCategory.id, name: trimmedName, icon_id: modalIcon })
      } else {
        await updateMutation.run({ id: editingCategory.id, name: trimmedName, icon: modalIcon })
      }
    }
  }, [modalMode, modalName, modalIcon, editingCategory, activeTab, createMutation, updateMutation])

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) {
      await deleteMutation.run(deleteTarget.id)
    }
  }, [deleteTarget, deleteMutation])

  const typeLabel = activeTab === 'expense' ? '支出' : '收入'
  const modalTitle = modalMode === 'add' ? `新增${typeLabel}分类` : `编辑${typeLabel}分类`

  const iconOptions = React.useMemo(
    () => [
      // Emoji presets
      ...EMOJI_PRESETS.map((emoji) => ({ value: emoji, icon: emoji as React.ReactNode })),
      // Shopping platform SVG presets
      ...SHOPPING_PLATFORM_ICONS.map((item) => ({
        value: `platform_${item.key}`,
        icon: getPlatformIconByKey(item.key) as React.ReactNode,
        label: item.label,
      })),
    ],
    [],
  )

  // Custom icon list (convert to CustomIconItem format)
  const customIconItems: CustomIconItem[] = React.useMemo(
    () => (customIcons || []).map((ci) => ({
      id: ci.id,
      icon_url: ci.icon_url,
      icon_type: ci.icon_type,
    })),
    [customIcons],
  )

  // Icon upload handler
  const handleIconUpload = useCallback(async (file: File, iconType: 'category' | 'book' | 'avatar') => {
    await uploadIcon(file, iconType)
    refetchIcons()
    notify({ type: 'success', message: '图标上传成功' })
  }, [refetchIcons])

  // Icon delete handler
  const handleIconDelete = useCallback(async (iconId: string) => {
    await deleteIcon(iconId)
    refetchIcons()
    notify({ type: 'success', message: '图标已删除' })
  }, [refetchIcons])

  return {
    activeTab,
    setActiveTab,
    modalOpen,
    setModalOpen,
    modalMode,
    editingCategory,
    setEditingCategory,
    modalName,
    setModalName,
    modalIcon,
    setModalIcon,
    deleteTarget,
    setDeleteTarget,
    selectedCategory,
    setSelectedCategory,
    showDetail,
    setShowDetail,
    customCategories,
    isLoading,
    customIcons,
    filteredCategories,
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
    createMutation,
    updateMutation,
    deleteMutation,
    handleOpenAdd,
    handleOpenEdit,
    handleModalConfirm,
    handleDeleteConfirm,
    typeLabel,
    modalTitle,
    iconOptions,
    customIconItems,
    handleIconUpload,
    handleIconDelete,
  }
}
