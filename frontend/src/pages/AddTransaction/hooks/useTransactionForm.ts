import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTransaction, getTransaction, updateTransaction, uploadReceipt } from '../../../services/api'
import { useCategories, buildCategoryOptions } from '../../../hooks/useCategories'
import { useTemplates } from '../../../hooks/useTemplates'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notify } from '../../../utils/notifications'
import { parseImageList } from '../../../utils/parseImageList'
import { compressImage } from '../../../utils/imageCompress'
import type { LocationResult } from '../../../types/map'

export const MAX_NOTE_LENGTH = 500
export const MAX_IMAGES = 5

export interface PendingImage {
  localUrl: string
  blob: Blob
}

export interface FormData {
  amount: string
  category: string
  type: 'expense' | 'income'
  date: string
  brand: string
  note: string
}

export function useTransactionForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editId = searchParams.get('edit')
  const isEditMode = !!editId

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: '',
    type: 'expense',
    date: todayStr,
    brand: '',
    note: '',
  })

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [savedImageUrls, setSavedImageUrls] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)

  // Queries
  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['transaction', editId],
    queryFn: () => getTransaction(Number(editId)),
    enabled: isEditMode,
  })

  const { data: categories = [] } = useCategories()
  const { data: templates = [] } = useTemplates()

  // Load edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        amount: String(editData.amount),
        category: editData.category,
        type: editData.type,
        date: editData.date,
        brand: editData.brand || '',
        note: editData.description || '',
      })
      if (editData.latitude && editData.longitude) {
        setLocation({
          locationName: editData.location_name || '',
          latitude: editData.latitude,
          longitude: editData.longitude,
          poiId: editData.poi_id || null,
        })
      }
      setSavedImageUrls(parseImageList(editData))
    }
  }, [editData])

  // Derived data
  const allImageUrls = useMemo(
    () => [...savedImageUrls, ...pendingImages.map((p) => p.localUrl)],
    [savedImageUrls, pendingImages],
  )

  const imageUrlsJson = useMemo(() => {
    if (savedImageUrls.length === 0) return undefined
    return JSON.stringify(savedImageUrls)
  }, [savedImageUrls])

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories, formData.type),
    [formData.type, categories],
  )

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.note || undefined,
        brand: formData.brand || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_name: location?.locationName,
        poi_id: location?.poiId,
      }
      return createTransaction(payload)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.note || undefined,
        brand: formData.brand || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_name: location?.locationName,
        poi_id: location?.poiId,
        image_urls: imageUrlsJson,
      }
      return updateTransaction(Number(editId), payload)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: number; file: Blob }) => {
      return uploadReceipt(transactionId, file)
    },
  })

  // Submit handler
  const { run: handleSubmit, isRunning: submitInProgress } = useDebouncedAction(async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      notify({ type: 'error', message: '请输入有效金额' })
      return
    }
    if (!formData.category) {
      notify({ type: 'error', message: '请选择分类' })
      return
    }

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync()

        if (pendingImages.length > 0 && editId) {
          const newUrls: string[] = []
          for (const p of pendingImages) {
            const r = await uploadMutation.mutateAsync({ transactionId: Number(editId), file: p.blob })
            if (r?.image_url) newUrls.push(r.image_url)
          }
          if (newUrls.length > 0) {
            const merged = [...savedImageUrls, ...newUrls]
            await updateTransaction(Number(editId), { image_urls: JSON.stringify(merged) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        notify({ type: 'success', message: '交易已更新' })
      } else {
        const result = await createMutation.mutateAsync()
        const newTransactionId = result?.id

        if (pendingImages.length > 0 && newTransactionId) {
          const uploadedUrls: string[] = []
          for (const p of pendingImages) {
            const r = await uploadMutation.mutateAsync({ transactionId: newTransactionId, file: p.blob })
            if (r?.image_url) uploadedUrls.push(r.image_url)
          }
          if (uploadedUrls.length > 0) {
            await updateTransaction(newTransactionId, { image_urls: JSON.stringify(uploadedUrls) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        notify({ type: 'success', message: '交易已保存' })
      }
      navigate('/transactions')
    } catch {
      notify({ type: 'error', message: isEditMode ? '更新失败' : '保存失败' })
    }
  })

  // Template handler
  const handleTemplateConfirm = (template: any) => {
    setFormData((prev) => ({
      ...prev,
      type: (template.type as 'expense' | 'income') || prev.type,
      category: template.category_id || prev.category,
      amount: template.amount ? String(template.amount) : prev.amount,
      brand: template.brand || prev.brand,
      note: template.note ?? prev.note,
    }))
    if (template.latitude && template.longitude) {
      setLocation({
        locationName: template.location_name || '',
        latitude: template.latitude,
        longitude: template.longitude,
        poiId: template.poi_id || null,
      })
    }
    setShowTemplateSelector(false)
    notify({ type: 'success', message: `已应用模板：${template.name}` })
  }

  // Location handler
  const handleLocationConfirm = (loc: LocationResult) => {
    setLocation(loc)
    setShowLocationPicker(false)
  }

  // File select handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = MAX_IMAGES - allImageUrls.length
    if (remaining <= 0) {
      notify({ type: 'error', message: `最多只能上传 ${MAX_IMAGES} 张图片` })
      e.target.value = ''
      return
    }

    const toProcess = Array.from(files).slice(0, remaining)

    try {
      const newPending: PendingImage[] = []
      let firstOcrDone = false

      for (const file of toProcess) {
        const compressed = await compressImage(file, 1200, 0.7)
        const localUrl = URL.createObjectURL(compressed)
        newPending.push({ localUrl, blob: compressed })

        if (!firstOcrDone) {
          firstOcrDone = true
          setOcrProcessing(true)
          try {
            const ocrResult = await parseReceiptOCR(compressed)
            if (ocrResult) {
              setFormData((prev) => ({
                ...prev,
                amount: ocrResult.amount || prev.amount,
                category: ocrResult.category || prev.category,
                note: ocrResult.note || prev.note,
                date: ocrResult.date || prev.date,
              }))
              notify({ type: 'success', message: 'OCR 识别成功，已自动填充表单' })
            }
          } catch {
            // OCR 失败不影响上传
          } finally {
            setOcrProcessing(false)
          }
        }
      }

      setPendingImages((prev) => [...prev, ...newPending])
    } catch {
      notify({ type: 'error', message: '图片处理失败' })
    }
    e.target.value = ''
  }

  const parseReceiptOCR = async (
    _blob: Blob,
  ): Promise<{ amount?: string; category?: string; note?: string; date?: string } | null> => {
    return null
  }

  // Image management
  const handleRemoveSavedImage = (idx: number) => {
    setSavedImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleRemovePendingImage = (idx: number) => {
    setPendingImages((prev) => {
      const removed = prev[idx]
      if (removed && removed.localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(removed.localUrl)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleClearAllImages = () => {
    pendingImages.forEach((p) => {
      if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl)
    })
    setPendingImages([])
    setSavedImageUrls([])
  }

  const handleReset = () => {
    setFormData({ amount: '', category: '', type: 'expense', date: todayStr, brand: '', note: '' })
    setLocation(null)
    handleClearAllImages()
  }

  const isSubmitting = submitInProgress || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canAddMore = allImageUrls.length < MAX_IMAGES

  return {
    editId, isEditMode, editLoading,
    formData, setFormData,
    location, setLocation,
    showLocationPicker, setShowLocationPicker,
    savedImageUrls, pendingImages, allImageUrls,
    showTemplateSelector, setShowTemplateSelector,
    ocrProcessing, canAddMore,
    categories, templates, categoryOptions,
    isSubmitting, fileInputRef,
    handleSubmit, handleTemplateConfirm, handleLocationConfirm,
    handleFileSelect, handleRemoveSavedImage, handleRemovePendingImage, handleClearAllImages, handleReset,
  }
}
