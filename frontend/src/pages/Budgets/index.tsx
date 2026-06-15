import React, { useState, useRef } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBudgets, fetchBudgetStatus, upsertBudgets } from '../../services/budgetsApi'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useFocusItem } from '../../hooks/useFocusItem'
import type { BudgetRecord, UpsertBudgetInput } from '../../types/budget'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal, ModalFooter } from '../../components/ui/Modal'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { NumberInput } from '../../components/ui/Input'
import { RankRow } from '../../components/ui/RankList'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { DetailModal } from '../../components/DetailModal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DropdownSelect } from '../../components/ui/Dropdown'

const getCurrentMonthStr = (): string => {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return format(firstOfMonth, 'yyyy-MM-dd')
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

  const lastSynced = useRef('')

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

  const getStatusVariant = (status: string): 'safe' | 'warn' | 'danger' => {
    switch (status) {
      case 'over':
        return 'danger'
      case 'warning':
        return 'warn'
      default:
        return 'safe'
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
    setSelectedBudget((prev: any) => ({
      ...prev,
      budget: newAmount,
      remaining: newAmount - prev.spent,
    }))
    setShowEditForm(false)
    setShowDetail(false)
  }

  const generateMonthOptions = (): { key: string; label: string }[] => {
    const options: { key: string; label: string }[] = []
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
      <Card>
        <CardHeader
          title="预算明细"
          subTitle={
            budgetsLoading ? (
              <Skeleton width="100px" height="14px" borderRadius="var(--rs)" />
            ) : (
              <DropdownSelect
                options={monthOptions}
                value={selectedMonth}
                onChange={(key) => key && setSelectedMonth(key)}
                allowClear={false}
                width="auto"
              />
            )
          }
          action={
            budgetsLoading ? (
              <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
            ) : (
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saveLoading}>
                  {saveLoading ? '保存中...' : '保存'}
                </Button>
              )
          }
        />

        {budgetsLoading ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="budget-item" style={{ pointerEvents: 'none' }}>
                <div className="budget-info">
                  <span className="budget-name">
                    <Skeleton width="12px" height="12px" borderRadius="3px" />
                    <span style={{ marginLeft: '6px', display: 'inline-block', verticalAlign: 'middle' }}>
                      <Skeleton width="80px" height="13px" />
                    </span>
                  </span>
                  <span className="budget-amount">
                    <Skeleton width="120px" height="12px" />
                  </span>
                </div>
                <div className="budget-bar">
                  <div className="fill" style={{ width: [60, 85, 45, 70, 30][i] + '%' }} />
                </div>
                <div className="budget-percent">
                  <Skeleton width="40%" height="11px" />
                </div>
              </div>
            ))}
          </>
        ) : expenseCategories.length === 0 ? (
          <EmptyState
            icon="📊"
            title="暂无支出分类"
            description="请先在分类管理中添加支出分类"
          />
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
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedBudget({ category: cat, spent, budget, progress, status, remaining })
                    setShowDetail(true)
                  }}
                >
                  <RankRow
                    id={cat.id}
                    icon={cat.icon}
                    label={cat.name}
                    amount={spent}
                    totalAmount={budget > 0 ? budget : undefined}
                    progress={budget > 0 ? progress : undefined}
                    status={getStatusVariant(status)}
                    meta={<span className="budget-percent">{budget > 0 ? `剩余 ¥${remaining.toLocaleString('zh-CN')}` : '未设置预算'}</span>}
                  />
                </div>
              )
            })}
          </>
        )}
      </Card>

      {selectedBudget && (
        <DetailModal
          visible={showDetail}
          onClose={() => {
            setShowDetail(false)
            setSelectedBudget(null)
          }}
          title="预算详情"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => handleOpenEditForm(selectedBudget)}
              >
                编辑预算
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                删除预算
              </Button>
            </>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{selectedBudget.category.icon}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedBudget.category.name}</div>
              <div className="detail-subtitle">已使用 {selectedBudget.progress}%</div>
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

      <Modal
        open={showEditForm && !!selectedBudget}
        onClose={() => setShowEditForm(false)}
        title={`编辑预算 - ${selectedBudget?.category.name || ''}`}
        footer={
          <ModalFooter
            onCancel={() => setShowEditForm(false)}
            onConfirm={handleEditFormSave}
            confirmText="确定"
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--muted)' }}>
            {selectedBudget?.category.icon} {selectedBudget?.category.name} 预算金额
          </label>
          <NumberInput
            prefix="¥"
            value={editFormValues.budget || '0'}
            onChange={handleEditFormChange}
            min={0}
          />
        </div>
      </Modal>

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
