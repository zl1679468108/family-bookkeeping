import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/Header'
import { Button } from '../components/ui/button'
import { ImageUploader } from '../components/ImageUploader'
import { FormGroup, FormRow } from '../components/Form'
import { typeOptions, expenseCategoryOptions, incomeCategoryOptions } from '../utils/commonDic'
import { createTransaction } from '../services/api'
import { notify } from '../utils/notifications'

const AddTransaction: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense' as 'expense' | 'income',
    date: '',
    note: ''
  })

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      notify({ type: 'success', message: '交易已保存成功！' })
      navigate('/')
    },
    onError: (error) => {
      notify({ type: 'error', message: `保存失败: ${error.message}` })
    }
  })

  useEffect(() => {
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
  }, [searchParams])

  useEffect(() => {
    if (!searchParams.get('category')) {
      setFormData(prev => ({ ...prev, category: '' }))
    }
  }, [formData.type, searchParams])

  const handleOcrComplete = (data: { amount: string; category: string; note: string }) => {
    setFormData({
      amount: data.amount,
      category: data.category,
      type: data.category === 'income' ? 'income' : 'expense',
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
      description: formData.note
    })
  }

  const currentCategoryOptions = formData.type === 'expense' ? expenseCategoryOptions : incomeCategoryOptions

  return (
    <div>
      <Header title="记一笔">
        <Button variant="secondary" onClick={() => navigate('/')}>
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
              {currentCategoryOptions.map((cat) => (
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

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <Button variant="secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>取消</Button>
          <Button style={{ flex: 2 }} onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddTransaction