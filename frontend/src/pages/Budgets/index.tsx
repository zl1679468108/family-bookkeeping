import React, { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth } from 'date-fns'
import { Header } from '../../components/Header'
import { Button } from '../../components/ui/button'
import { fetchBudgets, fetchBudgetStatus, upsertBudgets, copyBudgets } from '../../services/budgetsApi'
import { useCategoryLookup } from '../../hooks/useCategories'
import { useFocusItem } from '../../hooks/useFocusItem'
import type { BudgetRecord, UpsertBudgetInput } from '../../types/budget'
import { notify } from '../../utils/notifications'
import { Skeleton } from '../../components/ui/Skeleton'
import './index.scss'

/** 计算上月月份 */
const getPrevMonth = (month: string): string => {
  const [y, m] = month.split('-').map(Number)
  const prevDate = new Date(y, m - 2, 1)
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`
}

/** 获取当月月份字符串 */
const getCurrentMonthStr = (): string => {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd')
}

const Budgets: React.FC = () => {
  const queryClient = useQueryClient()
  const { categories, getCategoryName, getCategoryIcon } = useCategoryLookup()

  // 聚焦功能：URL 中的 ?focus=categoryKey → 高亮对应行（匹配 data-focus 属性）
  const { focusId, hasFocus } = useFocusItem()

  // 月份选择 — 默认本月
  const [month, setMonth] = useState<string>(getCurrentMonthStr())

  // 支出分类列表
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')

  // 获取已有预算记录
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<BudgetRecord[]>({
    queryKey: ['budgets', month],
    queryFn: () => fetchBudgets(month),
  })

  // 获取预算执行状态
  const { data: budgetStatus } = useQuery({
    queryKey: ['budgets', 'status', month],
    queryFn: () => fetchBudgetStatus(month),
  })

  // 构建分类-预算映射（已有记录 -> 默认值）
  const budgetMap = new Map<string, number>()
  budgets.forEach((b) => {
    budgetMap.set(b.category, b.amount)
  })

  // 状态映射（分类 -> BudgetCategoryStatus）
  const statusMap = new Map<string, { spent: number; progress: number; status: string }>()
  if (budgetStatus?.categories) {
    budgetStatus.categories.forEach((c) => {
      statusMap.set(c.category_id, { spent: c.spent, progress: c.progress, status: c.status })
    })
  }

  // 本地编辑状态：每个分类的预算金额（key = 中文名，用于 UI 输入框绑定）
  const [editValues, setEditValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    expenseCategories.forEach((cat) => {
      initial[cat.name] = budgetMap.get(cat.id) || 0
    })
    return initial
  })

  const lastSynced = useRef('');

  // 当 budgets 或分类数据加载完成，同步到 editValues
  React.useEffect(() => {
    if (expenseCategories.length === 0) return
    const synced: Record<string, number> = {}
    expenseCategories.forEach((cat) => {
      synced[cat.name] = budgetMap.get(cat.id) || 0
    })
    // 只在内容真正变化时才更新 state，避免无限循环
    const hash = JSON.stringify(synced)
    if (hash !== lastSynced.current) {
      lastSynced.current = hash
      setEditValues(synced)
    }
  }, [month, budgets, expenseCategories.length])

  // 编辑处理
  const handleAmountChange = (category: string, value: string) => {
    const num = parseFloat(value)
    setEditValues((prev) => ({
      ...prev,
      [category]: isNaN(num) ? 0 : Math.max(0, num),
    }))
  }

  // 保存预算
  const saveMutation = useMutation({
    mutationFn: (input: UpsertBudgetInput) => upsertBudgets(input),
    onSuccess: () => {
      notify({ type: 'success', message: '预算保存成功' })
      queryClient.invalidateQueries({ queryKey: ['budgets', month] })
      queryClient.invalidateQueries({ queryKey: ['budgets', 'status', month] })
    },
  })

  const handleSave = useCallback(() => {
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
      month,
      budgets: budgetsArray,
    })
  }, [expenseCategories, editValues, month, saveMutation])

  // 复制上月预算
  const copyMutation = useMutation({
    mutationFn: (targetMonth: string) => copyBudgets({ targetMonth }),
    onSuccess: () => {
      notify({ type: 'success', message: '已复制上月预算' })
      queryClient.invalidateQueries({ queryKey: ['budgets', month] })
      queryClient.invalidateQueries({ queryKey: ['budgets', 'status', month] })
    },
  })

  const handleCopyFromPrevious = () => {
    copyMutation.mutate(month)
  }

  /** 进度条颜色类 */
  const getProgressClass = (status: string): string => {
    switch (status) {
      case 'over': return 'progress--over'
      case 'warning': return 'progress--warning'
      default: return 'progress--safe'
    }
  }

  return (
    <div className="budgets-page">
      <Header title="预算管理" />

      {/* 月份选择器 + 复制上月 */}
      <div className="budgets-toolbar">
        <div className="budgets-month-selector">
          <label className="budgets-month-label">预算月份</label>
          <input
            type="month"
            className="budgets-month-input"
            value={month.substring(0, 7)}
            onChange={(e) => {
              const val = e.target.value
              if (val) {
                setMonth(`${val}-01`)
              }
            }}
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleCopyFromPrevious}
          disabled={copyMutation.isPending}
          style={{ fontSize: '13px' }}
        >
          {copyMutation.isPending ? '复制中...' : '复制上月预算'}
        </Button>
      </div>

      {/* 支出分类预算表 */}
      {budgetsLoading ? (
        <div style={{ padding: '8px 0' }}>
          <Skeleton width="160px" height="22px" marginBottom="20px" />
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < 5 ? '1px solid #f0f0f0' : 'none', background: '#fff' }}>
                <Skeleton width="36px" height="36px" borderRadius="8px" />
                <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
                  <Skeleton width="50%" height="14px" />
                </div>
                <Skeleton width="80px" height="14px" />
                <div style={{ marginLeft: '16px' }}><Skeleton width="60px" height="14px" /></div>
                <div style={{ marginLeft: '16px' }}><Skeleton width="60px" height="14px" /></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="budgets-table-section">
        <h3 className="budgets-section-title">
          📉 支出分类预算
        </h3>

        <div className="budgets-table">
          {/* 表头 */}
          <div className="budgets-table-header">
            <div className="budgets-col budgets-col--category">分类</div>
            <div className="budgets-col budgets-col--budget">预算金额</div>
            <div className="budgets-col budgets-col--spent">已花费</div>
            <div className="budgets-col budgets-col--progress">进度</div>
          </div>

          {/* 每行 */}
          {expenseCategories.map((cat) => {
            const catKey = cat.id
            const catStatus = statusMap.get(cat.id)
            const spent = catStatus?.spent || 0
            const progress = catStatus?.progress || 0
            const status = catStatus?.status || 'safe'
            const isFocused = hasFocus && focusId === catKey

            return (
              <div
                key={cat.name}
                data-focus={catKey}
                className={`budgets-table-row${isFocused ? ' spotlight--focused' : ''}`}
              >
                <div className="budgets-col budgets-col--category">
                  <span className="budgets-category-icon">{cat.icon}</span>
                  <span className="budgets-category-name">{cat.name}</span>
                </div>
                <div className="budgets-col budgets-col--budget">
                  <div className="budgets-amount-input-wrapper">
                    <span className="budgets-amount-prefix">¥</span>
                    <input
                      type="number"
                      className="budgets-amount-input"
                      value={editValues[cat.name] || ''}
                      onChange={(e) => handleAmountChange(cat.name, e.target.value)}
                      min="0"
                      step="100"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="budgets-col budgets-col--spent">
                  <span className="budgets-spent-value">
                    ¥{spent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="budgets-col budgets-col--progress">
                  <div className="budgets-progress-wrapper">
                    <div className="budgets-progress-bar">
                      <div
                        className={`budgets-progress-fill ${getProgressClass(status)}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className={`budgets-progress-label ${getProgressClass(status)}`}>
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}

      {/* 收入分类区域 */}
      <div className="budgets-table-section">
        <h3 className="budgets-section-title">
          📈 收入分类
        </h3>
        <div className="budgets-income-hint">
          <p>收入分类不设预算</p>
          <div className="budgets-income-categories">
            {incomeCategories.map((cat) => (
              <span key={cat.name} className="budgets-income-tag">
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="budgets-save-area">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          style={{ padding: '12px 32px', fontSize: '15px' }}
        >
          {saveMutation.isPending ? '保存中...' : '💾 保存预算'}
        </Button>
      </div>
    </div>
  )
}

export default Budgets
