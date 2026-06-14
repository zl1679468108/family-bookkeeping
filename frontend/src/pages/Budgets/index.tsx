import React, { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth } from 'date-fns'
import { fetchBudgets, fetchBudgetStatus, upsertBudgets } from '../../services/budgetsApi'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useFocusItem } from '../../hooks/useFocusItem'
import type { BudgetRecord, UpsertBudgetInput } from '../../types/budget'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { DetailModal } from '../../components/DetailModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DropdownSelect } from '../../components/ui/dropdown'
import type { DropdownOption } from '../../components/ui/dropdown'

const getCurrentMonthStr = (): string => {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd')
}

const formatMonthToDisplay = (monthStr: string): string => {
  const date = new Date(monthStr)
  return format(date, 'yyyy 年 MM 月')
}

const Budgets: React.FC = () => {
  const queryClient = useQueryClient()
  const { categories } = useCategoryLookup()

  const { focusId, hasFocus } = useFocusItem()

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr())

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  // 详情弹窗状态
  const [selectedBudget, setSelectedBudget] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormValues, setEditFormValues] = useState<Record<string, string>>({})

  const handleDeleteBudget = () => {
    handleAmountChange(selectedBudget.category.name, '0')
    setShowDetail(false)
    setShowDeleteConfirm(false)
    notify({ type: 'success', message: '预算已删除' })
  }

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<BudgetRecord[]>({
    queryKey: ['budgets', selectedMonth],
    queryFn: () => fetchBudgets(selectedMonth),
  })

  const { data: budgetStatus } = useQuery({
    queryKey: ['budgets', 'status', selectedMonth],
    queryFn: () => fetchBudgetStatus(selectedMonth),
  })

  const budgetMap = new Map<string, number>()
  budgets.forEach((b) => {
    budgetMap.set(b.category, b.amount)
  })

  const statusMap = new Map<string, { spent: number; progress: number; status: string }>()
  if (budgetStatus?.categories) {
    budgetStatus.categories.forEach((c) => {
      statusMap.set(c.category_id, { spent: c.spent, progress: c.progress, status: c.status })
    })
  }

  const [editValues, setEditValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    expenseCategories.forEach((cat) => {
      initial[cat.name] = budgetMap.get(cat.id) || 0
    })
    return initial
  })

  const lastSynced = useRef('');

  React.useEffect(() => {
    if (expenseCategories.length === 0) return
    const synced: Record<string, number> = {}
    expenseCategories.forEach((cat) => {
      synced[cat.name] = budgetMap.get(cat.id) || 0
    })
    const hash = JSON.stringify(synced)
    if (hash !== lastSynced.current) {
      lastSynced.current = hash
      setEditValues(synced)
    }
  }, [selectedMonth, budgets, expenseCategories])

  const handleAmountChange = (category: string, value: string) => {
    const num = parseFloat(value)
    setEditValues((prev) => ({
      ...prev,
      [category]: isNaN(num) ? 0 : Math.max(0, num),
    }))
  }

  const saveMutation = useMutation({
    mutationFn: (input: UpsertBudgetInput) => upsertBudgets(input),
    onSuccess: () => {
      notify({ type: 'success', message: '预算保存成功' })
      queryClient.invalidateQueries({ queryKey: ['budgets', selectedMonth] })
      queryClient.invalidateQueries({ queryKey: ['budgets', 'status', selectedMonth] })
    },
  })

  const { run: handleSave, isRunning: saveLoading } = useDebouncedAction(async () => {
    const budgetsArray = expenseCategories
      .filter((cat) => (editValues[cat.name] || 0) > 0)
      .map((cat) => ({
        category: cat.id,
        amount: editValues[cat.name] || 0,
      }))

    if (budgetsArray.length === 0) {
      notify({ type: 'error', message: '请至少设置一个分类的预算金额' })
      return
    }

    saveMutation.mutate({
      month: selectedMonth,
      budgets: budgetsArray,
    })
  })

  const getProgressClass = (status: string): string => {
    switch (status) {
      case 'over': return 'danger'
      case 'warning': return 'warn'
      default: return 'safe'
    }
  }

  const handleOpenEditForm = (budget: any) => {
    setEditFormValues({
      budget: String(budget.budget),
    })
    setShowEditForm(true)
  }

  const handleEditFormChange = (value: string) => {
    setEditFormValues({
      budget: value,
    })
  }

  const handleEditFormSave = () => {
    const num = parseFloat(editFormValues.budget)
    const newAmount = isNaN(num) ? 0 : Math.max(0, num)
    handleAmountChange(selectedBudget.category.name, String(newAmount))
    // 同步更新 selectedBudget，使详情页立即显示新值
    setSelectedBudget((prev: any) => ({
      ...prev,
      budget: newAmount,
      remaining: newAmount - prev.spent,
    }))
    setShowEditForm(false)
  }

  // 生成过去 12 个月份选项
  const generateMonthOptions = (): DropdownOption[] => {
    const options: DropdownOption[] = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = format(date, 'yyyy-MM-dd')
      const label = formatMonthToDisplay(value)
      options.push({ key: value, label })
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className="page-container">
      {/* 月份选择器 */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <DropdownSelect
          options={monthOptions}
          value={selectedMonth}
          onChange={(key) => key && setSelectedMonth(key)}
          placeholder="选择月份"
          allowClear={false}
        />
      </div>

      {/* 本月预算卡片 */}
      <div className="dash-card">
        <div className="card-header">
          <h3>预算明细</h3>
          {budgetsLoading ? (
            <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
          ) : (
            <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: '12px', padding: '5px 12px' }} disabled={saveLoading}>
              {saveLoading ? '保存中...' : '保存'}
            </button>
          )}
        </div>

        {budgetsLoading ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="budget-item" style={{ pointerEvents: 'none' }}>
                <div className="budget-info">
                  <Skeleton width="35%" height="13px" />
                  <Skeleton width="25%" height="13px" />
                </div>
                <Skeleton width="100%" height="5px" borderRadius="3px" />
                <Skeleton width="40%" height="12px" />
              </div>
            ))}
          </>
        ) : (
          <>
            {expenseCategories.map((cat) => {
            const catKey = cat.id
            const catStatus = statusMap.get(cat.id)
            const spent = catStatus?.spent || 0
            const budget = editValues[cat.name] || 0
            const progress = catStatus?.progress || 0
            const status = catStatus?.status || 'safe'
            const isFocused = hasFocus && focusId === catKey
            const remaining = budget - spent

            return (
              <div
                key={cat.name}
                data-focus={catKey}
                className={`budget-item${isFocused ? ' spotlight--focused' : ''}`}
                onClick={() => { setSelectedBudget({ category: cat, spent, budget, progress, status, remaining }); setShowDetail(true) }}
                style={{ cursor: 'pointer' }}
              >
                <div className="budget-info">
                  <span className="budget-name">{cat.icon} {cat.name}</span>
                  <span className="budget-amount">
                    ¥{spent.toLocaleString('zh-CN')} / ¥{budget.toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="budget-bar">
                  <div
                    className={`fill ${getProgressClass(status)}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="budget-percent">
                  {progress}% · 剩余 ¥{remaining.toLocaleString('zh-CN')}
                </div>
              </div>
            )
          })}
          </>
        )}
      </div>

      {/* 预算详情弹窗 */}
      {selectedBudget && (
        <DetailModal
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          title="预算详情"
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => handleOpenEditForm(selectedBudget)}
              >
                编辑预算
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除预算
              </button>
            </>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{selectedBudget.category.icon}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedBudget.category.name}</div>
              <div className="detail-subtitle">
                已使用 {selectedBudget.progress}%
              </div>
              <div className="detail-amount">
                <div className="detail-amount-value">
                  ¥{selectedBudget.spent.toLocaleString('zh-CN')} / ¥{selectedBudget.budget.toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-item-label">剩余</span>
              <span className="detail-item-value">¥{selectedBudget.remaining.toLocaleString('zh-CN')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-item-label">状态</span>
              <span className="detail-item-value">
                {selectedBudget.status === 'over' && '超预算'}
                {selectedBudget.status === 'warning' && '接近预算'}
                {selectedBudget.status === 'safe' && '正常'}
              </span>
            </div>
            {selectedBudget.month && (
              <div className="detail-item">
                <span className="detail-item-label">月份</span>
                <span className="detail-item-value">{formatMonthToDisplay(selectedBudget.month)}</span>
              </div>
            )}
          </div>
        </DetailModal>
      )}

      {/* 编辑表单弹窗 */}
      {showEditForm && selectedBudget && (
        <DetailModal
          visible={showEditForm}
          onClose={() => setShowEditForm(false)}
          title={`编辑预算 - ${selectedBudget.category.name}`}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditForm(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditFormSave}
              >
                确定
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
                {selectedBudget.category.icon} {selectedBudget.category.name} 预算金额
              </label>
              <input
                type="number"
                value={editFormValues.budget || '0'}
                onChange={(e) => handleEditFormChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: 'var(--rs)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--fg)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>
          </div>
        </DetailModal>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="确认删除"
        message="确定要删除这个预算吗？"
        onConfirm={handleDeleteBudget}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={false}
      />
    </div>
  )
}

export default Budgets
