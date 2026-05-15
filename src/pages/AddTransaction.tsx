import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '../components/Header/Header'
import { Button } from '../components/Button/Button'
import { ImageUploader } from '../components/ImageUploader/ImageUploader'
import { FormGroup } from '../components/Form/FormGroup'
import { FormRow } from '../components/Form/FormRow'
import { categoryOptions, typeOptions } from '../utils/commonDic'
import { createTransaction, hasSupabaseConfig } from '../services/supabase'

const AddTransaction: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    type: 'expense',
    date: '',
    note: ''
  })

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      alert('交易已保存成功！')
      navigate('/')
    },
    onError: (error) => {
      alert(`保存失败: ${error.message}`)
    }
  })

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, date: today }))
  }, [])

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
      alert('请填写金额和分类')
      return
    }

    if (!hasSupabaseConfig()) {
      alert('Supabase 未配置，请检查环境变量')
      return
    }

    mutation.mutate({
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type as 'income' | 'expense',
      date: formData.date,
      description: formData.note
    })
  }

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
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
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