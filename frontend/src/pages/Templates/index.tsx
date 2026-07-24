import React from 'react'
import { GlobalModal } from '../../components/ui'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useTemplatesPage } from './hooks/useTemplatesPage'
import { TemplateGrid } from './components/TemplateGrid'
import { TemplateDetailModal } from './components/TemplateDetailModal'
import { TemplateFormModal } from './components/TemplateFormModal'
import { useExecuteRecurring } from '../../hooks/useTemplates'
import { notifyError, notifySuccess } from '../../utils/notifyError'

const Templates: React.FC = () => {
  const {
    categories,
    isLoading,
    sortingMode,
    dragIndex,
    orderedList,
    handleEnterSortMode,
    handleSaveSort,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isSaving,
    selectedTemplate,
    setSelectedTemplate,
    showDetail,
    setShowDetail,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showForm,
    setShowForm,
    editingId,
    showLocationPicker,
    setShowLocationPicker,
    form,
    setForm,
    resetForm,
    handleSave,
    saveLoading,
    handleEdit,
    handleCopy,
    handleDeleteTemplate,
    deleteLoading,
    handleLocationConfirm,
    getCategoryInfo,
  } = useTemplatesPage()

  const executeRecurringMutation = useExecuteRecurring()

  const getNextExecutionDate = (t: any): string => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
    // 从末执行过且今天已到开始日期：当日可执行
    if (!t.last_executed_at && t.start_date && t.start_date <= today) return today
    if (t.last_executed_at) {
      const base = new Date(t.last_executed_at)
      const monthMap: Record<string, number> = { daily: 0, weekly: 0, monthly: 1, quarterly: 3, yearly: 12 }
      const addMonths = monthMap[t.frequency as string] ?? 1
      if (addMonths === 0) {
        base.setDate(base.getDate() + (t.frequency === 'weekly' ? 7 : 1))
      } else {
        base.setMonth(base.getMonth() + addMonths)
      }
      return base.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
    }
    return t.start_date || today
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })

  const hasRecurring = orderedList.some((t: any) => {
    if (!t.frequency) return false
    if (t.end_date && t.end_date < today) return false
    const nextDate = getNextExecutionDate(t)
    return nextDate <= today
  })

  const getRecurringCount = () => orderedList.filter((t: any) => {
    if (!t.frequency) return false
    if (t.end_date && t.end_date < today) return false
    const nextDate = getNextExecutionDate(t)
    return nextDate <= today
  }).length

  const handleExecuteRecurring = async () => {
    try {
      const result = await executeRecurringMutation.mutateAsync()
      const { executed, skipped } = result as { executed: number; skipped: number }
      notifySuccess(`周期模板执行完成：成功 ${executed} 个，跳过 ${skipped} 个`)
    } catch (err: any) {
      notifyError(err, '执行周期模板失败')
    }
  }

  return (
    <div className="page-container">
      <Card>
        <TemplateGrid
          isLoading={isLoading}
          sortingMode={sortingMode}
          dragIndex={dragIndex}
          orderedList={orderedList}
          isSaving={isSaving}
          onEnterSortMode={handleEnterSortMode}
          onSaveSort={handleSaveSort}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onNew={() => { resetForm(); setShowForm(true) }}
          onSelect={(t) => { setSelectedTemplate(t); setShowDetail(true) }}
          getCategoryInfo={getCategoryInfo}
        />
      </Card>

      {hasRecurring && (
        <div className="tpl-recurring-bar">
          <span className="tpl-recurring-hint">有 {getRecurringCount()} 个周期模板待执行</span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExecuteRecurring}
            disabled={executeRecurringMutation.isPending}
          >
            执行周期模板
          </Button>
        </div>
      )}

      <TemplateDetailModal
        template={selectedTemplate}
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedTemplate(null) }}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={() => setShowDeleteConfirm(true)}
        getCategoryInfo={getCategoryInfo}
      />

      <GlobalModal
        type="confirm"
        open={showDeleteConfirm}
        title="确认删除"
        children="确定要删除这个模板吗？"
        onConfirm={handleDeleteTemplate}
        onClose={() => setShowDeleteConfirm(false)}
        loading={deleteLoading}
        confirmText="确认删除"
        confirmDanger
      />

      <TemplateFormModal
        open={showForm}
        editingId={editingId}
        form={form}
        setForm={setForm}
        categories={categories}
        showLocationPicker={showLocationPicker}
        setShowLocationPicker={setShowLocationPicker}
        onClose={resetForm}
        onSave={handleSave}
        saveLoading={saveLoading}
        onLocationConfirm={handleLocationConfirm}
      />
    </div>
  )
}

export default Templates
