import React from 'react'
import { MAX_NOTE_LENGTH } from '../hooks/useTransactionForm'
import type { FormData } from '../hooks/useTransactionForm'

interface TransactionFormProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  categoryOptions: { value: string; label: string }[]
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  formData, setFormData, categoryOptions,
}) => {
  return (
    <>
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
              <option key={cat.value} value={cat.value}>{cat.label}</option>
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

      {/* 备注 */}
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
    </>
  )
}
