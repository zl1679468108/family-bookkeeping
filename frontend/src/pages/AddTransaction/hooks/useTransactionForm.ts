import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTransaction, getTransaction, updateTransaction, uploadReceipt, ocrReceipt } from '../../../services/api'
import type { OcrResult } from '../../../services/api'
import { useCategories } from '../../../hooks/useCategories'
import { useTemplates } from '../../../hooks/useTemplates'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import type { DropdownOption } from '../../../components/ui/Dropdown'
import { useDebouncedAction } from '../../../hooks/useDebouncedAction'
import { notifyError, notifyInfo, notifySuccess } from '../../../utils/notifyError'
import { parseImageList } from '../../../utils/parseImageList'
import { compressImage } from '../../../utils/imageCompress'
import type { LocationResult } from '@family-bookkeeping/shared-types'
import type { Template } from '@family-bookkeeping/shared-types'

export const MAX_NOTE_LENGTH = 500
export const MAX_IMAGES = 10

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
  // OCR 独立的文件输入：单选一张图，仅用于识别填充表单，不作为附件
  const ocrFileInputRef = useRef<HTMLInputElement>(null)

  const editIdRaw = searchParams.get('edit')
  const editIdNum = editIdRaw ? Number(editIdRaw) : NaN
  const isEditMode = !isNaN(editIdNum) && editIdNum > 0

  // todayStr 不缓存：保证用户跨午夜停留页面时日期会更新到当天（F-L6）
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })

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
    queryKey: ['transaction', editIdNum],
    queryFn: () => getTransaction(editIdNum),
    enabled: isEditMode,
  })

  const { data: categories = [] } = useCategories()
  const { data: templates = [], isLoading: templatesLoading } = useTemplates()

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

  // 从编辑模式切换到新建模式（或新建模式进入）时重置表单（F-M13）
  useEffect(() => {
    if (!isEditMode) {
      handleReset()
    }
    // 仅依赖 isEditMode，切换时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode])

  // Derived data
  const allImageUrls = useMemo(
    () => [...savedImageUrls, ...pendingImages.map((p) => p.localUrl)],
    [savedImageUrls, pendingImages],
  )

  // 仅 updateMutation 使用 imageUrlsJson；新建时通过后续 updateTransaction 更新图片 URL（F-L7）
  const imageUrlsJson = useMemo(() => {
    if (savedImageUrls.length === 0) return undefined
    return JSON.stringify(savedImageUrls)
  }, [savedImageUrls])

  const categoryOptions = useMemo(() => {
    return categories
      .filter((c: any) => c.type === formData.type)
      .map((c: any) => ({
        key: c.id,
        label: c.name,
        icon: renderCategoryIcon(c.icon, { size: 18 }),
      })) as DropdownOption[]
  }, [formData.type, categories])

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
      return updateTransaction(editIdNum, payload)
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async ({ transactionId, file }: { transactionId: number; file: Blob }) => {
      return uploadReceipt(transactionId, file)
    },
  })

  // Submit handler
  const { run: handleSubmit, isRunning: submitInProgress } = useDebouncedAction(async () => {
    const amountNum = parseFloat(formData.amount)
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      notifyInfo('请输入有效金额')
      return
    }
    if (!formData.category) {
      notifyInfo('请选择分类')
      return
    }

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync()

        if (pendingImages.length > 0 && editIdNum) {
          // 并行上传多张图片（F-M12）
          const results = await Promise.all(
            pendingImages.map((p) => uploadMutation.mutateAsync({ transactionId: editIdNum, file: p.blob })),
          )
          const newUrls = results.map((r) => r?.image_url).filter((url): url is string => Boolean(url))
          if (newUrls.length > 0) {
            const merged = [...savedImageUrls, ...newUrls]
            await updateTransaction(editIdNum, { image_urls: JSON.stringify(merged) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
        notifySuccess('交易已更新')
      } else {
        const result = await createMutation.mutateAsync()
        const newTransactionId = result?.id

        if (pendingImages.length > 0 && newTransactionId) {
          // 并行上传多张图片（F-M12）
          const results = await Promise.all(
            pendingImages.map((p) => uploadMutation.mutateAsync({ transactionId: newTransactionId, file: p.blob })),
          )
          const uploadedUrls = results.map((r) => r?.image_url).filter((url): url is string => Boolean(url))
          if (uploadedUrls.length > 0) {
            await updateTransaction(newTransactionId, { image_urls: JSON.stringify(uploadedUrls) })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        queryClient.invalidateQueries({ queryKey: ['budgets'] })
        notifySuccess('交易已保存')
      }
      handleReset()
      navigate('/transactions')
    } catch (err: any) {
      notifyError(err, (isEditMode ? '更新失败' : '保存失败') )
    }
  })

  // Template handler
  const handleTemplateConfirm = (template: Template) => {
    setFormData((prev) => ({
      ...prev,
      type: (template.type as 'expense' | 'income') || prev.type,
      category: template.category_id || prev.category,
      amount: template.amount ? String(template.amount) : prev.amount,
      brand: template.merchant_name || prev.brand,
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
    notifySuccess(`已应用模板：${template.name}`)
  }

  // Location handler
  const handleLocationConfirm = (loc: LocationResult) => {
    setLocation(loc)
    setShowLocationPicker(false)
  }

  // 附件上传：多选图片作为交易附件，不做 OCR（与 OCR 识别是独立的两件事）
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = MAX_IMAGES - allImageUrls.length
    if (remaining <= 0) {
      notifyError(`最多只能上传 ${MAX_IMAGES} 张图片`)
      e.target.value = ''
      return
    }

    const toProcess = Array.from(files).slice(0, remaining)

    try {
      const newPending: PendingImage[] = []
      for (const file of toProcess) {
        const compressed = await compressImage(file, 1200, 0.7)
        const localUrl = URL.createObjectURL(compressed)
        newPending.push({ localUrl, blob: compressed })
      }
      setPendingImages((prev) => [...prev, ...newPending])
    } catch {
      notifyError('图片处理失败')
    }
    e.target.value = ''
  }

  // OCR 识别：上传图片到后端进行识别，结果填充表单
  const handleOcrSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrProcessing(true)
    try {
      const compressed = await compressImage(file, 1200, 0.7)
      const ocrResult: OcrResult | null = await ocrReceipt(compressed)
      if (ocrResult && (ocrResult.amount || ocrResult.date)) {
        setFormData((prev) => {
          let next = { ...prev }
          if (ocrResult.type && ocrResult.type !== prev.type) {
            next.type = ocrResult.type
            next.category = ''
          }
          next.amount = ocrResult.amount !== undefined ? ocrResult.amount : prev.amount
          next.date = ocrResult.date || prev.date
          next.note = ocrResult.note || prev.note
          return next
        })
        notifySuccess('OCR 识别成功，已自动填充表单')
      } else {
        notifyError('未能识别票据内容，请重试或手动填写')
      }
    } catch {
      // 后端已返回中文错误提示（含免费额度用完的场景），前端不需要额外通知
    } finally {
      setOcrProcessing(false)
      e.target.value = ''
    }
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
    // 编辑模式下"重置"恢复为原始编辑数据，而非清空（F-M11）
    if (isEditMode && editData) {
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
      } else {
        setLocation(null)
      }
      // 清理 pending 但保留已保存的图片
      pendingImages.forEach((p) => {
        if (p.localUrl.startsWith('blob:')) URL.revokeObjectURL(p.localUrl)
      })
      setPendingImages([])
      setSavedImageUrls(parseImageList(editData))
    } else {
      setFormData({ amount: '', category: '', type: 'expense', date: todayStr, brand: '', note: '' })
      setLocation(null)
      handleClearAllImages()
    }
  }

  const isSubmitting = submitInProgress || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canAddMore = allImageUrls.length < MAX_IMAGES

  return {
    isEditMode, editLoading,
    formData, setFormData,
    location, setLocation,
    showLocationPicker, setShowLocationPicker,
    savedImageUrls, pendingImages, allImageUrls,
    showTemplateSelector, setShowTemplateSelector,
    ocrProcessing, canAddMore,
    categories, templates, templatesLoading, categoryOptions,
    isSubmitting, fileInputRef, ocrFileInputRef,
    handleSubmit, handleTemplateConfirm, handleLocationConfirm,
    handleFileSelect, handleOcrSelect, handleRemoveSavedImage, handleRemovePendingImage, handleClearAllImages, handleReset,
  }
}
