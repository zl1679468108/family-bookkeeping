import React, { useMemo, useState, useRef } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBudgets, fetchBudgetStatus, upsertBudgets } from '../../services/budgetsApi'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useCategoryLookup } from '../../hooks/useCategories'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import { useFocusItem } from '../../hooks/useFocusItem'
import { useMonthRangeOptions } from '../../hooks/useMonthRangeOptions'
import type { BudgetRecord, UpsertBudgetInput } from '../../types/budget'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import { GlobalModal, DetailItem, Space } from '../../components/ui'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { NumberInput } from '../../components/ui/Input'
import { RankRow } from '../../components/ui/RankList'
import { EmptyState } from '../../components/ui/EmptyState'
import { DropdownSelect } from '../../components/ui/Dropdown'

const formatMonthToDisplay = (monthStr: string): string => {
  const date = new Date(monthStr)
  return format(date, 'yyyy 年 MM 月')
}

const Budgets: React.FC = () => {
  const queryClient = useQueryClient()
  const { categories } = useCategoryLookup()

  const { focusId, hasFocus } = useFocusItem()

  // 使用月份范围 hook，前后5年
  const { monthOptions, currentMonthKey } = useMonthRangeOptions()

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)

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

  const budgetMap = useMemo(() => {
    const map = new Map<string, number>()
    budgets.forEach((b) => {
      map.set(b.category, b.amount)
    })
    return map
  }, [budgets])

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
  }, [selectedMonth, budgetMap, expenseCategories])

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
    onError: (err: any) => {
      notify({ type: 'error', message: err?.message || '预算保存失败' })
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

  return (
    <div className="page-container">
      <Card>
        <div className="card-header">
          <div className="card-header-left">
            <h3 className="card-title">预算明细</h3>
            {budgetsLoading ? (
              <Skeleton width="100px" height="14px" borderRadius="var(--rs)" />
            ) : (
              <DropdownSelect
                options={monthOptions}
                value={selectedMonth}
                onChange={(key) => key && setSelectedMonth(key)}
                allowClear={false}
                width="auto"
                showSearch
                searchPlaceholder="搜索月份..."
              />
            )}
          </div>
          <div className="card-header-action">
            {budgetsLoading ? (
              <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
            ) : (
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? '保存中...' : '保存'}
              </Button>
            )}
          </div>
        </div>

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
              const statusClass = status === 'over' ? ' budget-item--over' : status === 'warning' ? ' budget-item--warn' : ''

              return (
                <div
                  key={cat.name}
                  data-focus={catKey}
                  className={`budget-item${statusClass}${isFocused ? ' spotlight--focused' : ''}`}
                  onClick={() => {
                    setSelectedBudget({ category: cat, spent, budget, progress, status, remaining })
                    setShowDetail(true)
                  }}
                >
                  <RankRow
                    id={cat.id}
                    icon={renderCategoryIcon(cat.icon, { size: 18 })}
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
        <GlobalModal
          type="detail"
          open={showDetail}
          onClose={() => {
            setShowDetail(false)
            setSelectedBudget(null)
          }}
          title="预算详情"
          footer={
            <Space size="sm">
              <Button
                variant="secondary"
                onClick={() => handleOpenEditForm(selectedBudget)}
              >
                编辑预算
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                删除预算
              </Button>
            </Space>
          }
        >
          <div className="detail-content-wrapper">
            <div className="detail-icon">{renderCategoryIcon(selectedBudget.category.icon, { size: 40 })}</div>
            <div className="detail-content">
              <div className="detail-title">{selectedBudget.category.name}</div>
            </div>
          </div>
          <div className="detail-divider" />
          <div className="detail-grid">
            <DetailItem label="使用进度" value={`${selectedBudget.progress}%`} />
            <DetailItem label="已使用" value={`¥${selectedBudget.spent.toLocaleString('zh-CN')}`} />
            <DetailItem label="预算" value={`¥${selectedBudget.budget.toLocaleString('zh-CN')}`} />
            <DetailItem label="剩余" value={`¥${selectedBudget.remaining.toLocaleString('zh-CN')}`} />
            <DetailItem
              label="状态"
              value={
                selectedBudget.status === 'over' ? '超预算' :
                  selectedBudget.status === 'warning' ? '接近预算' : '正常'
              }
            />
            {selectedBudget.month && (
              <DetailItem label="月份" value={formatMonthToDisplay(selectedBudget.month)} />
            )}
          </div>
        </GlobalModal>
      )}

      <GlobalModal
        open={showEditForm && !!selectedBudget}
        onClose={() => setShowEditForm(false)}
        title={`编辑预算 - ${selectedBudget?.category.name || ''}`}
        footer={
          <div className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={() => setShowEditForm(false)}>取消</Button>
            <Button variant="primary" onClick={handleEditFormSave}>确定</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--muted)' }} className="field-required">
            预算金额
          </label>
          <NumberInput
            prefix="¥"
            value={editFormValues.budget}
            onChange={handleEditFormChange}
            min={0}
            placeholder="0"
          />
        </div>
      </GlobalModal>

      <GlobalModal
        type="confirm"
        open={showDeleteConfirm}
        title="确认删除"
        children="确定要删除这个预算吗？"
        onConfirm={handleDeleteBudget}
        onClose={() => setShowDeleteConfirm(false)}
        confirmText="确认删除"
        confirmDanger
      />
    </div>
  )
}

export default Budgets
