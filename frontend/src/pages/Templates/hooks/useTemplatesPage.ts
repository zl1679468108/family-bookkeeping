import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate, reorderTemplates } from '../../../services/templatesApi'
import { useCategories } from '../../../hooks/useCategories'
import { useSort } from '../../../hooks/useSort'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notify } from '../../../utils/notifications'
import type { CreateTemplateInput } from '../../../types/template'
import type { LocationResult } from '../../../types/map'

export function useTemplatesPage() {
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
  })

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
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
  } = useSort(['templates'], templates, (orders) => {
    const ids = orders.map(o => o.id)
    return reorderTemplates({ ids })
  })

  const { run: handleDeleteTemplate, isRunning: deleteLoading } = useDebouncedAction(async () => {
    try {
      await deleteTemplate(selectedTemplate.id)
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setShowDetail(false)
      setShowDeleteConfirm(false)
      setSelectedTemplate(null)
      notify({ type: 'success', message: '模板已删除' })
    } catch (err: any) {
      notify({ type: 'error', message: err?.message || '删除失败' })
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateInput) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      notify({ type: 'success', message: '模板已创建' })
    },
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '创建失败' })
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
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '更新失败' })
    },
  })

  const resetForm = () => {
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
