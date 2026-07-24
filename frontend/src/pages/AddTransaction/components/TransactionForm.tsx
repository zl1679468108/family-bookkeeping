import React from 'react'
import { DropdownSelect } from '../../../components/ui/Dropdown'
import { FormField } from '../../../components/ui/FormField'
import { Textarea } from '../../../components/ui/Textarea'
import { sanitizeAmountInput } from '../../../utils/budget'
import { TRANSACTION_TYPE_OPTIONS } from '../../../utils/transactionType'
import { SegControl } from '../../../components/ui/SegControl'
import { MAX_NOTE_LENGTH } from '../hooks/useTransactionForm'
import type { FormData } from '../hooks/useTransactionForm'
import type { DropdownOption } from '../../../components/ui/Dropdown'
import { FORM_AMOUNT_PLACEHOLDER, FORM_SELECT_CATEGORY, FORM_BRAND_EXAMPLE, FORM_DESC_EXAMPLE } from '../../../utils/formCopy'

interface TransactionFormProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  categoryOptions: DropdownOption[]
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  formData, setFormData, categoryOptions,
}) => {
  return (
    <>
      {/* 类型切换 */}
      <SegControl
        className="transaction-type-seg"
        options={TRANSACTION_TYPE_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
        value={formData.type === 'income' ? 'income' : 'expense'}
        onChange={(type) => setFormData((prev) => ({ ...prev, type, category: '' }))}
      />

      <FormField
        label="金额"
        labelClassName="field-required"
        type="text"
        className="form-input amt"
        placeholder={FORM_AMOUNT_PLACEHOLDER}
        value={formData.amount}
        onChange={(e) => {
          const v = sanitizeAmountInput(e.target.value)
          setFormData((prev) => ({ ...prev, amount: v }))
        }}
        inputMode="decimal"
      />

      <div className="form-row">
        <div className="form-group">
          <DropdownSelect
            label="分类"
            options={categoryOptions}
            value={formData.category}
            onChange={(key) => setFormData((prev) => ({ ...prev, category: key }))}
            placeholder={FORM_SELECT_CATEGORY}
            required
            width="100%"
          />
        </div>
        <FormField
          label="日期"
          labelClassName="field-required"
          type="date"
          className="form-input"
          value={formData.date}
          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
        />
      </div>

      <FormField
        label="品牌"
        type="text"
        className="form-input"
        placeholder={FORM_BRAND_EXAMPLE}
        value={formData.brand}
        onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
        maxLength={100}
      />

      <Textarea
        label="备注"
        placeholder={FORM_DESC_EXAMPLE}
        value={formData.note}
        onChange={(e) => {
          const v = e.target.value.slice(0, MAX_NOTE_LENGTH)
          setFormData((prev) => ({ ...prev, note: v }))
        }}
        maxLength={MAX_NOTE_LENGTH}
        showCount
        rows={4}
      />
    </>
  )
}
