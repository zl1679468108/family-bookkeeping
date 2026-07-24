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
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  confirmDeleteThis,
} from '../../utils/confirmCopy'
import {
  hasDueRecurringTemplates,
  countDueRecurringTemplates,
} from '../../utils/templateRecurring'
import { successRecurringExecuted } from '../../utils/successCopy'
import { ERROR_EXECUTE_RECURRING_FAILED } from '../../utils/errorCopy'

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

  const hasRecurring = hasDueRecurringTemplates(orderedList)
  const getRecurringCount = () => countDueRecurringTemplates(orderedList)

  const handleExecuteRecurring = async () => {
    try {
      const result = await executeRecurringMutation.mutateAsync()
      const { executed, skipped } = result as { executed: number; skipped: number }
      notifySuccess(successRecurringExecuted(executed, skipped))
    } catch (err: any) {
      notifyError(err, ERROR_EXECUTE_RECURRING_FAILED)
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
        title={CONFIRM_DELETE_TITLE}
        children={confirmDeleteThis("模板")}
        onConfirm={handleDeleteTemplate}
        onClose={() => setShowDeleteConfirm(false)}
        loading={deleteLoading}
        confirmText={CONFIRM_DELETE_TEXT}
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
