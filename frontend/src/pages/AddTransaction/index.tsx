import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LocationPicker } from './components/LocationPicker'
import { TemplateSelector } from './components/TemplateSelector'
import { createTransaction, getTransaction, updateTransaction, uploadReceipt } from '../../services/api'
import { useCategories, buildCategoryOptions } from '../../hooks/useCategories'
import { useTemplates } from '../../hooks/useTemplates'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { compressImage } from '../../utils/imageCompress'
import type { LocationResult } from '../../types/map'

const MAX_NOTE_LENGTH = 500
const MAX_IMAGES = 5

interface PendingImage {
  localUrl: string
  blob: Blob
}

const parseImageList = (tx: any): string[] => {
  if (tx?.image_url_list && Array.isArray(tx.image_url_list) && tx.image_url_list.length > 0) {
    return tx.image_url_list
  }
  if (tx?.image_urls) {
    try {
      const parsed = JSON.parse(tx.image_urls)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // 解析失败，尝试按逗号分割
      if (typeof tx.image_urls === 'string' && tx.image_urls.includes(',')) {
        return tx.image_urls.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
    }
  }
  if (tx?.image_url) return [tx.image_url]
  return []
}

const AddTransaction: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editId = searchParams.get('edit')
  const isEditMode = !!editId

  const todayStr = useMemo(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  }, [])

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense' as 'expense' | 'income',
    date: todayStr,
    brand: '',
    note: '',
  })

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  // 已存在的图片 URL（编辑态来自原记录，或者上传后的 URL）
  const [savedImageUrls, setSavedImageUrls] = useState<string[]>([])
  // 新选但未上传的图片
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)

  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['transaction', editId],
    queryFn: () => getTransaction(Number(editId)),
    enabled: isEditMode,
  })

  const { data: categories = [] } = useCategories()
  const { data: templates = [] } = useTemplates()

  useEffect(() => {
    if (editData) {
      setFormData({
        amount: String(editData.amount),
        category: editData.category,
        type: editData.type,
        date: editData.date,
        brand: (editData as any).brand || '',
        note: editData.description || '',
      })
      if ((editData as any).latitude && (editData as any).longitude) {
        setLocation({
          locationName: editData.location_name || '',
          latitude: (editData as any).latitude,
          longitude: (editData as any).longitude,
          poiId: (editData as any).poi_id || null,
        })
      }
      setSavedImageUrls(parseImageList(editData))
    }
  }, [editData])

  const allImageUrls = useMemo(
    () => [...savedImageUrls, ...pendingImages.map((p) => p.localUrl)],
    [savedImageUrls, pendingImages],
  )

  const imageUrlsJson = useMemo(() => {
    if (savedImageUrls.length === 0) return undefined
    return JSON.stringify(savedImageUrls)
  }, [savedImageUrls])

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
        // 编辑模式：直接更新 text 字段，上传新图并追加到 image_urls
        await updateMutation.mutateAsync()

        // 上传新选的图片并追加
        if (pendingImages.length > 0 && editId) {
          const newUrls: string[] = []
          for (const p of pendingImages) {
            const r = await uploadMutation.mutateAsync({
              transactionId: Number(editId),
              file: p.blob,
            })
            if (r?.image_url) newUrls.push(r.image_url)
          }
          if (newUrls.length > 0) {
            const merged = [...savedImageUrls, ...newUrls]
            await updateTransaction(Number(editId), {
              image_urls: JSON.stringify(merged),
            })
          }
        }

        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        notify({ type: 'success', message: '交易已更新' })
      } else {
        // 新建模式：先创建交易，再上传全部图片
        const result = await createMutation.mutateAsync()
        const newTransactionId = (result as any).id

        if (pendingImages.length > 0 && newTransactionId) {
          const uploadedUrls: string[] = []
          for (const p of pendingImages) {
            const r = await uploadMutation.mutateAsync({
              transactionId: newTransactionId,
              file: p.blob,
            })
            if (r?.image_url) uploadedUrls.push(r.image_url)
          }
          if (uploadedUrls.length > 0) {
            await updateTransaction(newTransactionId, {
              image_urls: JSON.stringify(uploadedUrls),
            })
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

  const handleLocationConfirm = (loc: LocationResult) => {
    setLocation(loc)
    setShowLocationPicker(false)
  }

  const categoryOptions = useMemo(() => {
    return buildCategoryOptions(categories, formData.type)
  }, [formData.type, categories])

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

        // 只对第一张图尝试 OCR
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

  const isSubmitting =
    submitInProgress || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending

  if (isEditMode && editLoading) {
    return (
      <div className="page-container">
        <div className="add-grid">
          <div className="add-left">
            <Skeleton width="100%" height="48px" borderRadius="8px" marginBottom="16px" />
            <Skeleton width="100%" height="44px" borderRadius="8px" marginBottom="16px" />
            <Skeleton width="100%" height="44px" borderRadius="8px" marginBottom="16px" />
            <Skeleton width="100%" height="44px" borderRadius="8px" marginBottom="16px" />
          </div>
          <div className="add-right">
            <Skeleton width="80%" height="20px" marginBottom="16px" />
            <Skeleton width="100%" height="60px" borderRadius="8px" />
          </div>
        </div>
      </div>
    )
  }

  const canAddMore = allImageUrls.length < MAX_IMAGES

  return (
    <div className="page-container">
      <div className="add-grid">
        {/* 左侧：表单 */}
        <div className="add-left">
          {/* 类型切换 Tab */}
          <div className="form-tabs">
            <button
              className={formData.type !== 'income' ? 'active' : ''}
              onClick={() => setFormData((prev) => ({ ...prev, type: 'expense', category: '' }))}
            >
              支出
            </button>
            <button
              className={formData.type === 'income' ? 'active' : ''}
              onClick={() => setFormData((prev) => ({ ...prev, type: 'income', category: '' }))}
            >
              收入
            </button>
          </div>

          {/* 金额 */}
          <div className="form-group">
            <label className="field-required">金额</label>
            <input
              type="text"
              className="form-input amt"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                setFormData((prev) => ({ ...prev, amount: v }))
              }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="field-required">分类</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">选择分类</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="field-required">日期</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          {/* 品牌 */}
          <div className="form-group">
            <label>品牌</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：雅诗兰黛、苹果"
              value={formData.brand}
              onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
              maxLength={100}
            />
          </div>

          {/* 备注：多行文本 + 字数统计 */}
          <div className="form-group">
            <label>备注</label>
            <textarea
              className="form-input textarea"
              placeholder="例如：小棕瓶 50ml，给妈妈买的礼物"
              value={formData.note}
              onChange={(e) => {
                const v = e.target.value.slice(0, MAX_NOTE_LENGTH)
                setFormData((prev) => ({ ...prev, note: v }))
              }}
              maxLength={MAX_NOTE_LENGTH}
              rows={4}
            />
            <div className="char-counter">
              {formData.note.length} / {MAX_NOTE_LENGTH}
            </div>
          </div>

          {/* 多图上传区域 */}
          <div className="upload-section">
            <div className="upload-header">
              <span className="upload-title">
                附件 ({allImageUrls.length} / {MAX_IMAGES})
              </span>
              {allImageUrls.length > 0 && (
                <button className="link-btn" onClick={handleClearAllImages}>
                  清空
                </button>
              )}
            </div>

            <div className="image-grid">
              {/* 已保存的图片 */}
              {savedImageUrls.map((url, idx) => (
                <div key={`saved-${idx}`} className="image-item">
                  <img src={url} alt={`附件 ${idx + 1}`} />
                  <button
                    className="image-remove"
                    onClick={() => handleRemoveSavedImage(idx)}
                    title="删除此图"
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* 新选的待上传图片 */}
              {pendingImages.map((p, idx) => (
                <div key={`pending-${idx}`} className="image-item">
                  <img src={p.localUrl} alt={`待上传 ${idx + 1}`} />
                  <button
                    className="image-remove"
                    onClick={() => handleRemovePendingImage(idx)}
                    title="删除此图"
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* 添加按钮 */}
              {canAddMore && (
                <div className="image-add" onClick={() => fileInputRef.current?.click()}>
                  <span className="image-add-icon">+</span>
                  <span className="image-add-text">添加图片</span>
                </div>
              )}
            </div>
            {ocrProcessing && <span className="upload-ocr-tip">OCR 识别中...</span>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* 位置按钮 */}
          <div style={{ marginTop: 14 }}>
            <button
              className={`loc-btn ${location ? 'sel' : ''}`}
              onClick={() => setShowLocationPicker(true)}
            >
              {location ? (
                <div className="loc-btn-content">
                  <div className="loc-name">📍 {location.locationName}</div>
                  {location.latitude && location.longitude && (
                    <div className="loc-coords">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                  )}
                  {location.poiId && <div className="loc-poi">商户ID: {location.poiId}</div>}
                  <div className="loc-edit">· 点击修改</div>
                </div>
              ) : (
                '📍 选择地点（高德地图选点）'
              )}
            </button>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 14 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : isEditMode ? '保存修改' : '确认添加'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  amount: '',
                  category: '',
                  type: 'expense',
                  date: todayStr,
                  brand: '',
                  note: '',
                })
                setLocation(null)
                handleClearAllImages()
              }}
            >
              重置
            </button>
          </div>
        </div>

        {/* 右侧：快捷方式 */}
        <div className="add-right">
          <h4>快捷方式</h4>
          <div className="sc-grid">
            <div className="sc-item" onClick={() => setShowTemplateSelector(true)}>
              <div className="sc-icon">📋</div>
              <div className="sc-name">选择模板</div>
              <div className="sc-desc">一键填充表单</div>
            </div>
            <div className="sc-item" onClick={() => fileInputRef.current?.click()}>
              <div className="sc-icon">📷</div>
              <div className="sc-name">OCR识别</div>
              <div className="sc-desc">拍照识别票据</div>
            </div>
          </div>
        </div>
      </div>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={location}
      />

      <TemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onConfirm={handleTemplateConfirm}
        templates={templates}
      />
    </div>
  )
}

export default AddTransaction
