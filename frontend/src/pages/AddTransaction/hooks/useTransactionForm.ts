import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createTransaction, getTransaction, updateTransaction, uploadReceipt, ocrReceipt } from '../../../services/api'
import type { OcrResult } from '../../../services/api'
import { useCategories } from '../../../hooks/useCategories'
import { useTemplates } from '../../../hooks/useTemplates'
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon'
import type { DropdownOption } from '../../../components/ui/Dropdown'
import { useMutationAction } from '../../../hooks/useMutationAction'
import { notifyError, notifyInfo, notifySuccess } from '../../../utils/notifyError'
import { isValidPositiveAmount } from '../../../utils/budget'
import { parseImageList } from '../../../utils/parseImageList'
import { compressImage } from '../../../utils/imageCompress'
import type { LocationResult } from '@family-bookkeeping/shared-types'
import type { Template } from '@family-bookkeeping/shared-types'
import { useBook } from '../../../hooks/useBook'
import { queryKeys, TRANSACTION_IMPACT_ROOT_KEYS } from '../../../utils/queryKeys'
import { STALE } from '../../../utils/cachePolicy'
import {
  clearAddTransactionDraft,
  loadAddTransactionDraft,
  saveAddTransactionDraft,
} from '../../../utils/addTransactionDraft'
import { successTemplateApplied } from '../../../utils/successCopy'
import { FORM_AMOUNT_INVALID, FORM_CATEGORY_REQUIRED } from '../../../utils/formCopy'

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
  const { currentBook } = useBook()
  const bookId = currentBook?.id || ''
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // OCR 独立的文件输入：单选一张图，仅用于识别填充表单，不作为附件
  const ocrFileInputRef = useRef<HTMLInputElement>(null)
  const draftRestoredRef = useRef(false)

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
    queryKey: queryKeys.transactions.detail(bookId, editIdNum),
    queryFn: () => getTransaction(editIdNum),
    enabled: isEditMode && !!bookId,
    staleTime: STALE.transactionDetail,
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

  // 新建模式：从 sessionStorage 恢复草稿（按账本隔离）
  useEffect(() => {
    if (isEditMode) {
      draftRestoredRef.current = false
      return
    }
    if (!bookId || draftRestoredRef.current) return
    draftRestoredRef.current = true
    const draft = loadAddTransactionDraft(bookId)
    if (!draft) return
    setFormData({
      amount: draft.formData.amount || '',
      category: draft.formData.category || '',
      type: draft.formData.type === 'income' ? 'income' : 'expense',
      date: draft.formData.date || todayStr,
      brand: draft.formData.brand || '',
      note: draft.formData.note || '',
    })
    setLocation(draft.location || null)
  }, [bookId, isEditMode, todayStr])

  // 新建模式：表单变更时自动保存草稿
  useEffect(() => {
    if (isEditMode || !bookId || !draftRestoredRef.current) return
    const isEmpty =
      !formData.amount &&
      !formData.category &&
      !formData.brand &&
      !formData.note &&
      !location
    if (isEmpty) {
      clearAddTransactionDraft(bookId)
      return
    }
    saveAddTransactionDraft(bookId, {
      formData: {
        amount: formData.amount,
        category: formData.category,
        type: formData.type,
        date: formData.date,
        brand: formData.brand,
        note: formData.note,
      },
      location,
    })
  }, [formData, location, bookId, isEditMode])

  // Derived data
  const allImageUrls = useMemo(
    () => [...savedImageUrls, ...pendingImages.map((p) => p.localUrl)],
    [savedImageUrls, pendingImages],
  )

  // 编辑时 payload 带已保存图片 URL；新建先建单再上传后写回 image_urls（F-L7）
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

  /** 表单 → 交易 payload（新建/编辑共用） */
  const buildTransactionPayload = (withSavedImages: boolean) => ({
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
    ...(withSavedImages && imageUrlsJson ? { image_urls: imageUrlsJson } : {}),
  })

  /** 并行上传待传图片，返回合并后的 URL 列表 */
  const uploadPendingImages = async (transactionId: number, baseUrls: string[] = []) => {
    if (pendingImages.length === 0) return baseUrls
    const results = await Promise.all(
      pendingImages.map((p) => uploadReceipt(transactionId, p.blob)),
    )
    const newUrls = results.map((r) => r?.image_url).filter((url): url is string => Boolean(url))
    return newUrls.length > 0 ? [...baseUrls, ...newUrls] : baseUrls
  }

  type SubmitResult = 'updated' | 'created' | 'invalid'

  // 统一提交：校验 + 创建/更新 + 图片上传 + 缓存失效
  const { run: handleSubmit, isRunning: submitInProgress } = useMutationAction(
    async (): Promise<SubmitResult> => {
      if (!isValidPositiveAmount(formData.amount)) {
        notifyInfo(FORM_AMOUNT_INVALID)
        return 'invalid'
      }
      if (!formData.category) {
        notifyInfo(FORM_CATEGORY_REQUIRED)
        return 'invalid'
      }

      if (isEditMode) {
        await updateTransaction(editIdNum, buildTransactionPayload(true))
        if (pendingImages.length > 0 && editIdNum) {
          const merged = await uploadPendingImages(editIdNum, savedImageUrls)
          if (merged.length > savedImageUrls.length) {
            await updateTransaction(editIdNum, { image_urls: JSON.stringify(merged) })
          }
        }
        return 'updated'
      }

      const result = await createTransaction(buildTransactionPayload(false))
      const newTransactionId = result?.id
      if (pendingImages.length > 0 && newTransactionId) {
        const uploadedUrls = await uploadPendingImages(newTransactionId)
        if (uploadedUrls.length > 0) {
          await updateTransaction(newTransactionId, { image_urls: JSON.stringify(uploadedUrls) })
        }
      }
      return 'created'
    },
    {
      invalidateKeys: TRANSACTION_IMPACT_ROOT_KEYS,
      shouldCommit: (result) => result === 'updated' || result === 'created',
      successMessage: (result) =>
        result === 'updated' ? '交易已更新' : result === 'created' ? '交易已保存' : null,
      errorMessage: isEditMode ? '更新失败' : '保存失败',
      onSuccess: (result) => {
        if (result !== 'updated' && result !== 'created') return
        if (bookId) clearAddTransactionDraft(bookId)
        handleReset()
        navigate('/transactions')
      },
    },
  )

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
    notifySuccess(successTemplateApplied(template.name))
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
      if (bookId) clearAddTransactionDraft(bookId)
    }
  }

  const isSubmitting = submitInProgress
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
