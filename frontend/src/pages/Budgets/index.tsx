import React, { useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBudgets, fetchBudgetStatus, upsertBudgets, copyBudgets } from '../../services/budgetsApi'
import { useDebouncedAction } from '../../hooks/useDebouncedAction'
import { useCategoryLookup } from '../../hooks/useCategories'
import { renderCategoryIcon } from '../../utils/renderCategoryIcon'
import { useFocusItem } from '../../hooks/useFocusItem'
import { useMonthRangeOptions } from '../../hooks/useMonthRangeOptions'
import type { BudgetRecord, UpsertBudgetInput } from '@family-bookkeeping/shared-types';
import { notify } from '../../utils/notifications'
import { notifyError } from '../../utils/notifyError'
import { Skeleton } from '../../components/ui/Skeleton'
import { GlobalModal, DetailItem, Space } from '../../components/ui'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { NumberInput } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { DropdownSelect } from '../../components/ui/Dropdown'
import { budgetStatusToVariant, budgetVariantLabel } from '../../utils/budget'

const formatMonthToDisplay = (monthStr: string): string => {
  const date = new Date(monthStr)
  return format(date, 'yyyy 年 MM 月')
}

const progressFillClass = (variant: 'safe' | 'warn' | 'danger'): string => {
  switch (variant) {
    case 'danger': return 'progress-fill--danger'
    case 'warn': return 'progress-fill--warn'
    default: return 'progress-fill--safe'
  }
}

const Budgets: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { categories } = useCategoryLookup()

  const { focusId, hasFocus } = useFocusItem()
  const { monthOptions, currentMonthKey } = useMonthRangeOptions()
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const [selectedBudget, setSelectedBudget] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editFormValues, setEditFormValues] = useState<Record<string, string>>({})


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
    onSuccess: (_data, variables) => {
      // 单条清零不在这里 toast，由调用方提示「已删除」
      const isSingleClear =
        variables.budgets.length === 1 && variables.budgets[0].amount === 0
      if (!isSingleClear) {
        notify({ type: 'success', message: '预算保存成功' })
      }
      queryClient.invalidateQueries({ queryKey: ['budgets', selectedMonth] })
      queryClient.invalidateQueries({ queryKey: ['budgets', 'status', selectedMonth] })
    },
    onError: (err: any) => {
      notifyError(err, '预算保存失败')
    },
  })

  /** 构建需提交的预算列表：正数全量 + 原先有预算现清零的分类（amount=0 以落库） */
  const buildBudgetPayload = (values: Record<string, number>) => {
    return expenseCategories
      .map((cat) => {
        const amount = values[cat.name] || 0
        const prev = budgetMap.get(cat.id) || 0
        if (amount > 0 || prev > 0) {
          return { category: cat.id, amount }
        }
        return null
      })
      .filter(Boolean) as { category: string; amount: number }[]
  }

  const { run: handleSave, isRunning: saveLoading } = useDebouncedAction(async () => {
    const budgetsArray = buildBudgetPayload(editValues)

    if (budgetsArray.length === 0) {
      notify({ type: 'error', message: '请至少设置一个分类的预算金额' })
      return
    }

    saveMutation.mutate({
      month: selectedMonth,
      budgets: budgetsArray,
    })
  })

  const { run: handleCopyLastMonth, isRunning: copyLoading } = useDebouncedAction(async () => {
    try {
      const result = await copyBudgets({ targetMonth: selectedMonth })
      if (!result || result.length === 0) {
        notify({ type: 'error', message: '上月暂无预算可复制' })
        return
      }
      notify({ type: 'success', message: `已复制上月 ${result.length} 条预算` })
      queryClient.invalidateQueries({ queryKey: ['budgets', selectedMonth] })
      queryClient.invalidateQueries({ queryKey: ['budgets', 'status', selectedMonth] })
    } catch (err: any) {
      notifyError(err, '复制上月预算失败')
    }
  })

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

  /** 单条编辑立即落库（含清零） */
  const handleEditFormSave = () => {
    if (!selectedBudget) return
    const num = parseFloat(editFormValues.budget)
    const newAmount = isNaN(num) ? 0 : Math.max(0, num)
    const catName = selectedBudget.category.name as string
    const catId = selectedBudget.category.id as string

    if (newAmount === 0 && (selectedBudget.budget || 0) > 0) {
      // 走删除确认，避免误清零
      setShowEditForm(false)
      setShowDeleteConfirm(true)
      return
    }

    handleAmountChange(catName, String(newAmount))
    saveMutation.mutate(
      {
        month: selectedMonth,
        budgets: [{ category: catId, amount: newAmount }],
      },
      {
        onSuccess: () => {
          setSelectedBudget((prev: any) =>
            prev
              ? {
                  ...prev,
                  budget: newAmount,
                  remaining: newAmount - (prev.spent || 0),
                }
              : prev,
          )
          setShowEditForm(false)
          setShowDetail(false)
        },
      },
    )
  }

  /** 删除/清零：立即 upsert amount=0 */
  const handleDeleteBudget = () => {
    if (!selectedBudget) return
    const catId = selectedBudget.category.id as string
    const catName = selectedBudget.category.name as string
    handleAmountChange(catName, '0')
    saveMutation.mutate(
      {
        month: selectedMonth,
        budgets: [{ category: catId, amount: 0 }],
      },
      {
        onSuccess: () => {
          notify({ type: 'success', message: '预算已删除' })
          setShowDetail(false)
          setShowDeleteConfirm(false)
          setSelectedBudget(null)
        },
      },
    )
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
              />
            )}
          </div>
          <div className="card-header-action" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {budgetsLoading ? (
              <Skeleton width="60px" height="28px" borderRadius="var(--rs)" />
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLastMonth}
                  disabled={copyLoading || saveLoading}
                >
                  {copyLoading ? '复制中...' : '复制上月'}
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saveLoading || copyLoading}>
                  {saveLoading ? '保存中...' : '保存'}
                </Button>
              </>
            )}
          </div>
        </div>

        {budgetsLoading ? (
          <div className="list-card-grid">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="list-card" style={{ pointerEvents: 'none' }}>
                <div className="list-card__header">
                  <Skeleton width="18px" height="18px" borderRadius="4px" />
                  <Skeleton width="60%" height="14px" />
                </div>
                <div className="budget-card__amount">
                  <Skeleton width="120px" height="13px" />
                </div>
                <div className="budget-card__progress">
                  <div className="budget-card__bar">
                    <div className="fill" style={{ width: [60, 85, 45, 70, 30][i] + '%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : expenseCategories.length === 0 ? (
          <EmptyState
            title="暂无支出分类"
            description="请先在分类管理中添加支出分类"
            action={
              <Button variant="primary" size="sm" onClick={() => navigate('/categories')}>
                去添加分类
              </Button>
            }
          />
        ) : (
          <div className="list-card-grid">
            {expenseCategories.map((cat) => {
              const catKey = cat.id
              const catStatus = statusMap.get(cat.id)
              const spent = catStatus?.spent || 0
              const budget = editValues[cat.name] || 0
              const progress = catStatus?.progress || 0
              const status = catStatus?.status || 'safe'
              const isFocused = hasFocus && focusId === catKey
              const remaining = budget - spent
              const variant = budgetStatusToVariant(status)
              const fillCls = progressFillClass(variant)
              const statusClass = variant === 'danger' ? ' budget-card--over' : variant === 'warn' ? ' budget-card--warn' : ''

              return (
                <div
                  key={cat.name}
                  data-focus={catKey}
                  className={`list-card${statusClass}${isFocused ? ' spotlight--focused' : ''}`}
                  onClick={() => {
                    setSelectedBudget({ category: cat, spent, budget, progress, status, remaining })
                    setShowDetail(true)
                  }}
                >
                  <div className="list-card__header">
                    <span className="list-card__icon">{renderCategoryIcon(cat.icon, { size: 18 })}</span>
                    <span className="list-card__title">{cat.name}</span>
                  </div>
                  <div className="budget-card__amount">
                    {budget > 0 ? (
                      <>
                        <span>¥{spent.toLocaleString('zh-CN')} / ¥{budget.toLocaleString('zh-CN')}</span>
                        <span className="budget-card__remaining">剩余 ¥{remaining.toLocaleString('zh-CN')}</span>
                      </>
                    ) : (
                      <span className="budget-card__unset">未设置预算</span>
                    )}
                  </div>
                  {budget > 0 && (
                    <div className="budget-card__progress">
                      <div className="budget-card__bar">
                        <div
                          className={`budget-card__fill ${fillCls}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="budget-card__percent">{progress}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
              value={budgetVariantLabel(budgetStatusToVariant(selectedBudget.status))}
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
          <label style={{ fontSize: '13px', color: 'var(--fg3)' }} className="field-required">
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
        children={selectedBudget ? `确定删除「${selectedBudget.category.name}」本月预算吗？删除后该分类预算将清零。` : "确定要删除这个预算吗？"}
        onConfirm={handleDeleteBudget}
        onClose={() => setShowDeleteConfirm(false)}
        confirmText="确认删除"
        confirmDanger
      />
    </div>
  )
}

export default Budgets
