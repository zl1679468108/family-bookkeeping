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
    note: ''
  })

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  // 保存待上传的文件，提交时再上传
  const pendingFileRef = useRef<Blob | null>(null)

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
      if (editData.image_url) {
        setReceiptImageUrl(editData.image_url)
      }
    }
  }, [editData])

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        type: formData.type,
        date: formData.date,
        description: formData.note || undefined,
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
        latitude: location?.latitude,
        longitude: location?.longitude,
        location_name: location?.locationName,
        poi_id: location?.poiId,
        image_url: receiptImageUrl || undefined,
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
        // 编辑模式：直接更新
        await updateMutation.mutateAsync()
        // 如果有待上传的文件，先上传再更新
        if (pendingFileRef.current && editId) {
          const uploadResult = await uploadMutation.mutateAsync({
            transactionId: Number(editId),
            file: pendingFileRef.current,
          })
          await updateTransaction(Number(editId), { image_url: uploadResult.image_url })
        }
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        notify({ type: 'success', message: '交易已更新' })
      } else {
        // 新建模式：先创建交易，再上传图片
        const result = await createMutation.mutateAsync()
        const newTransactionId = (result as any).id

        // 如果有待上传的文件，上传到新建的交易
        if (pendingFileRef.current && newTransactionId) {
          const uploadResult = await uploadMutation.mutateAsync({
            transactionId: newTransactionId,
            file: pendingFileRef.current,
          })
          await updateTransaction(newTransactionId, { image_url: uploadResult.image_url })
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
    setFormData(prev => ({
      ...prev,
      type: (template.type as 'expense' | 'income') || prev.type,
      category: template.category_id || prev.category,
      amount: template.amount ? String(template.amount) : prev.amount,
      note: template.note ?? prev.note,
    }))
    // 填充模板中的位置信息
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

  // 文件上传处理（合并附件/相册/OCR）
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await compressImage(file, 1200, 0.7)
      const localUrl = URL.createObjectURL(compressed)
      setReceiptImageUrl(localUrl)

      // 保存压缩后的文件，提交时再上传
      pendingFileRef.current = compressed

      // 尝试 OCR 解析
      setOcrProcessing(true)
      try {
        const ocrResult = await parseReceiptOCR(compressed)
        if (ocrResult) {
          setFormData(prev => ({
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
    } catch {
      notify({ type: 'error', message: '图片处理失败' })
    }
    e.target.value = ''
  }

  // 简易 OCR 解析（从图片文件名或后续接入真实 OCR API）
  const parseReceiptOCR = async (_blob: Blob): Promise<{ amount?: string; category?: string; note?: string; date?: string } | null> => {
    // TODO: 接入真实 OCR API（如 tesseract.js 或后端 OCR 服务）
    // 当前返回 null，由用户手动填写
    return null
  }

  const handleDeleteImage = () => {
    if (receiptImageUrl && receiptImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(receiptImageUrl)
    }
    setReceiptImageUrl(null)
    pendingFileRef.current = null
  }

  const isSubmitting = submitInProgress || createMutation.isPending || updateMutation.isPending || uploadMutation.isPending

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

  return (
    <div className="page-container">
      <div className="add-grid">
        {/* 左侧：表单 */}
        <div className="add-left">
          {/* 类型切换 Tab */}
          <div className="form-tabs">
            <button
              className={formData.type !== 'income' ? 'active' : ''}
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
            >支出</button>
            <button
              className={formData.type === 'income' ? 'active' : ''}
              onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
            >收入</button>
          </div>

          {/* 金额 */}
          <div className="form-group">
            <label>金额</label>
            <input
              type="text"
              className="form-input amt"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                setFormData(prev => ({ ...prev, amount: v }))
              }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>分类</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">选择分类</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>日期</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>备注</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：午餐·川味小馆"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            />
          </div>

          {/* 合并的附件上传区域 */}
          <div className="upload-section">
            {receiptImageUrl ? (
              <div className="upload-preview">
                <img src={receiptImageUrl} alt="附件预览" />
                <div className="upload-actions">
                  <button className="upload-btn replace" onClick={() => fileInputRef.current?.click()}>
                    替换
                  </button>
                  <button className="upload-btn delete" onClick={handleDeleteImage}>
                    删除
                  </button>
                </div>
                {ocrProcessing && <span className="upload-ocr-tip">OCR 识别中...</span>}
              </div>
            ) : (
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📎</div>
                <div className="upload-text">点击上传附件/收据</div>
                <div className="upload-hint">支持拍照、相册、文件，上传后自动 OCR 识别</div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
                  {location.poiId && (
                    <div className="loc-poi">商户ID: {location.poiId}</div>
                  )}
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
              {isSubmitting ? '保存中...' : (isEditMode ? '保存修改' : '确认添加')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFormData({ amount: '', category: '', type: 'expense', date: todayStr, note: '' })
                setLocation(null)
                handleDeleteImage()
              }}
            >重置</button>
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
