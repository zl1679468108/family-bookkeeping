import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, reorderTemplates, executeRecurring } from '../../../services/templatesApi'
import { useCategories } from '../../../hooks/useCategories'
import { useSort } from '../../../hooks/useSort'
import { useMutationAction } from '../../../hooks/useMutationAction'
import { notify } from '../../../utils/notifications'
import { notifyInfo } from '../../../utils/notifyError'
import type { CreateTemplateInput } from '@family-bookkeeping/shared-types';
import type { LocationResult } from '@family-bookkeeping/shared-types'
import { useBook } from '../../../hooks/useBook'
import { queryKeys } from '../../../utils/queryKeys'
import { STALE } from '../../../utils/cachePolicy'
import { successEntityDeleted, successEntityUpsert } from '../../../utils/successCopy'
import { FORM_TEMPLATE_NAME_REQUIRED } from '../../../utils/formCopy'

export function useTemplatesPage() {
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''
  const queryClient = useQueryClient()

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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
    frequency: '',
    start_date: '',
    end_date: '',
  })

  const { data: templates = [], isLoading } = useQuery({
    queryKey: queryKeys.templates.list(bookId),
    queryFn: fetchTemplates,
    enabled: !!bookId,
    staleTime: STALE.templates,
  })

  const { data: categories = [] } = useCategories()

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
  } = useSort(queryKeys.templates.all, templates, (orders) => {
    const ids = orders.map(o => o.id)
    return reorderTemplates({ ids })
  })

  const { run: handleDeleteTemplate, isRunning: deleteLoading } = useMutationAction(
    () => deleteTemplate(selectedTemplate.id),
    {
      invalidateKeys: [queryKeys.templates.all],
      successMessage: successEntityDeleted('模板'),
      errorMessage: '删除失败',
      onSuccess: () => {
        setShowDetail(false)
        setShowDeleteConfirm(false)
        setSelectedTemplate(null)
      },
    },
  )

  const createMutation = useMutationAction(
    (data: CreateTemplateInput) => createTemplate(data),
    {
      invalidateKeys: [queryKeys.templates.all],
      successMessage: successEntityUpsert('模板', false),
      errorMessage: '创建失败',
    },
  )

  const updateMutation = useMutationAction(
    ({ id, data }: { id: string; data: Partial<CreateTemplateInput> }) => updateTemplate(id, data),
    {
      invalidateKeys: [queryKeys.templates.all],
      successMessage: successEntityUpsert('模板', true),
      errorMessage: '更新失败',
      onSuccess: () => {
        setShowForm(false)
        setShowDetail(false)
        setSelectedTemplate(null)
      },
    },
  )

  const resetForm = () => {
    const currentTypeTemplates = templates.filter(t => t.type === form.type)
    const nextSortOrder = currentTypeTemplates.length + 1
    setForm({ name: '', type: 'expense', category_id: '', amount: '', note: '', latitude: '', longitude: '', location_name: '', poi_id: '', sort_order: nextSortOrder, frequency: '', start_date: '', end_date: '' })
    setShowForm(false)
    setEditingId(null)
  }

  const { run: handleSave, isRunning: saveLoading } = useMutationAction(async () => {
    if (!form.name.trim()) {
      notifyInfo(FORM_TEMPLATE_NAME_REQUIRED)
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
      frequency: form.frequency || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
    }
    if (editingId) {
      await updateMutation.run({ id: editingId, data })
    } else {
      await createMutation.run(data)
    }
    resetForm()
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
      frequency: t.frequency || '',
      start_date: t.start_date || '',
      end_date: t.end_date || '',
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
      frequency: '',
      start_date: '',
      end_date: '',
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

  return {
    templates,
    categories,
    isLoading,
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
    selectedTemplate,
    setSelectedTemplate,
    showDetail,
    setShowDetail,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showForm,
    setShowForm,
    editingId,
    showLocationPicker,
    setShowLocationPicker,
    form,
    setForm,
    resetForm,
    handleSave,
    saveLoading,
    handleEdit,
    handleCopy,
    handleDeleteTemplate,
    deleteLoading,
    handleLocationConfirm,
    getCategoryInfo,
  }
}
