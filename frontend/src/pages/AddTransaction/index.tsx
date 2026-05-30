import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Header } from '../../components/Header'
import { Button } from '../../components/ui/button'
import { ImageUploader } from '../../components/ImageUploader'
import { LocationPicker } from './components/LocationPicker'
import { FormGroup, FormRow } from '../../components/Form'
import { typeOptions } from '../../utils/commonDic'
import { createTransaction, getTransaction, updateTransaction } from '../../services/api'
import { useCategories, buildCategoryOptions, useCategoryLookup } from '../../hooks/useCategories'
import { notify } from '../../utils/notifications'
import type { LocationResult } from '../../types/map'
import './index.scss'

const AddTransaction: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const editId = searchParams.get('edit')
  const isEditMode = !!editId

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense' as 'expense' | 'income',
    date: '',
    note: ''
  })

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const { data: editData, isLoading: editLoading } = useQuery({
    queryKey: ['transaction', editId],
    queryFn: () => getTransaction(Number(editId)),
    enabled: isEditMode,
  })

  // 从 API 获取所有分类（默认 + 自定义）
  const { data: categories = [] } = useCategories()
  const { getCategoryId } = useCategoryLookup()

  // Pre-fill form when edit data is loaded
  useEffect(() => {
    if (editData) {
      setFormData({
        amount: String(editData.amount),
        category: editData.category,
        type: editData.type,
        date: editData.date,
        note: editData.description || '',
      })
      // 加载已有位置信息
      if ((editData as any).latitude && (editData as any).longitude) {
        setLocation({
          latitude: (editData as any).latitude,
          longitude: (editData as any).longitude,
          locationName: (editData as any).location_name || '',
          poiId: (editData as any).poi_id || null,
        })
      }
    }
  }, [editData])

  // Initialize form for new transaction
  useEffect(() => {
    if (isEditMode) {
      return // Handled by the editData effect above
    }

    const today = new Date().toISOString().split('T')[0]
    const type = searchParams.get('type') as 'expense' | 'income' | null
    const category = searchParams.get('category') || ''

    const initialType = (type === 'income' || type === 'expense') ? type : 'expense'
    const initialCategory = category

    setFormData({
      amount: '',
      category: initialCategory,
      type: initialType,
      date: today,
      note: ''
    })
  }, [searchParams, isEditMode])

  useEffect(() => {
    if (!isEditMode && !searchParams.get('category')) {
      setFormData(prev => ({ ...prev, category: '' }))
    }
  }, [formData.type, searchParams, isEditMode])

  const mutation = useMutation({
    mutationFn: (data: { amount: number; category: string; type: 'expense' | 'income'; date: string; description: string; latitude?: number; longitude?: number; locationName?: string; poiId?: string }) =>
      isEditMode
        ? updateTransaction(Number(editId), data)
        : createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['transaction', editId] })
      }
      notify({ type: 'success', message: isEditMode ? '交易已更新！' : '交易已保存成功！' })
      navigate(isEditMode ? '/transactions' : '/')
    },
  })

  const handleOcrComplete = (data: { amount: string; categoryName: string; note: string }) => {
    // 将 OCR 识别的分类名转换为 category UUID
    const categoryId = getCategoryId(data.categoryName) || '';
    setFormData({
      amount: data.amount,
      category: categoryId,
      type: formData.type, // OCR 不改交易类型，保持用户当前选择
      date: new Date().toISOString().split('T')[0],
      note: data.note
    })
  }

  const handleSubmit = () => {
    if (!formData.amount || !formData.category) {
      notify({ type: 'error', message: '请填写金额和分类' })
      return
    }

    mutation.mutate({
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      date: formData.date,
      description: formData.note,
      ...(location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: location.locationName,
        poiId: location.poiId || undefined,
      } : {}),
    })
  }

  const handleLocationConfirm = (result: LocationResult) => {
    if (result.latitude === 0 && result.longitude === 0) {
      setLocation(null)
    } else {
      setLocation(result)
    }
    setShowLocationPicker(false)
  }

  // 分类选项：从 API 获取（已包含默认 + 自定义）
  const categoryOptions = useMemo(() => {
    return buildCategoryOptions(categories, formData.type)
  }, [formData.type, categories])

  if (isEditMode && editLoading) {
    return (
      <div>
        <Header title="编辑交易" />
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}> </div>
      </div>
    )
  }

  return (
    <div>
      <Header title={isEditMode ? '编辑交易' : '记一笔'}>
        <Button variant="secondary" onClick={() => navigate(isEditMode ? '/transactions' : '/')}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
          取消
        </Button>
      </Header>

      <div className="form-section">
        <ImageUploader onOcrComplete={handleOcrComplete} />

        <FormGroup label="金额">
          <input 
            type="number" 
            className="form-input" 
            placeholder="¥ 0.00" 
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          />
        </FormGroup>

        <FormRow>
          <FormGroup label="类型">
            <select 
              className="form-select" 
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'expense' | 'income' }))}
            >
              {typeOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="分类">
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
          </FormGroup>
        </FormRow>

        <FormGroup label="日期">
          <input 
            type="date" 
            className="form-input" 
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
        </FormGroup>

        <FormGroup label="备注">
          <input 
            type="text" 
            className="form-input" 
            placeholder="添加备注..." 
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
          />
        </FormGroup>

        <FormGroup label="位置">
          {location ? (
            <div className="location-selected">
              <span className="location-selected-icon">📍</span>
              <span className="location-selected-text">{location.locationName}</span>
              <button
                className="location-selected-change"
                onClick={() => setShowLocationPicker(true)}
              >
                修改
              </button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowLocationPicker(true)} style={{ width: '100%' }}>
              📍 添加位置（可选）
            </Button>
          )}
        </FormGroup>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={() => navigate(isEditMode ? '/transactions' : '/')}>取消</Button>
          <Button style={{ flex: 2 }} onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? '保存中...' : (isEditMode ? '更新' : '保存')}
          </Button>
        </div>
      </div>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={location}
      />
    </div>
  )
}

export default AddTransaction
