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
import {
  buildTemplatePayload,
  validateTemplateFormFields,
  templateToFormFields,
  templateToCopyFormFields,
  emptyTemplateFormFields,
  resolveCategoryDisplay,
  type TemplateFormFields,
} from '../../../utils/templatePayload'
import { ERROR_DELETE_FAILED, ERROR_CREATE_FAILED, ERROR_UPDATE_FAILED } from '../../../utils/errorCopy'
import { ENTITY_TEMPLATE } from '../../../utils/entityCopy';

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
  const [form, setForm] = useState<TemplateFormFields>(emptyTemplateFormFields())

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
      successMessage: successEntityDeleted(ENTITY_TEMPLATE),
      errorMessage: ERROR_DELETE_FAILED,
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
      successMessage: successEntityUpsert(ENTITY_TEMPLATE, false),
      errorMessage: ERROR_CREATE_FAILED,
    },
  )

  const updateMutation = useMutationAction(
    ({ id, data }: { id: string; data: Partial<CreateTemplateInput> }) => updateTemplate(id, data),
    {
      invalidateKeys: [queryKeys.templates.all],
      successMessage: successEntityUpsert(ENTITY_TEMPLATE, true),
      errorMessage: ERROR_UPDATE_FAILED,
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
    setForm(emptyTemplateFormFields({ type: 'expense', sort_order: nextSortOrder }))
    setShowForm(false)
    setEditingId(null)
  }

  const { run: handleSave, isRunning: saveLoading } = useMutationAction(async () => {
    const check = validateTemplateFormFields(form)
    if (!check.ok) {
      notifyInfo(check.message)
      return
    }
    const data = buildTemplatePayload(form) as CreateTemplateInput
    if (editingId) {
      await updateMutation.run({ id: editingId, data })
    } else {
      await createMutation.run(data)
    }
    resetForm()
  })

  const handleEdit = (t: any) => {
    setForm(templateToFormFields(t))
    setEditingId(t.id)
    setShowForm(true)
  }

  const handleCopy = (t: any) => {
    setForm(templateToCopyFormFields(t))
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

  const getCategoryInfo = (categoryId: string | undefined) =>
    resolveCategoryDisplay(categories, categoryId)

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
