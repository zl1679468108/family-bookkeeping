import React from 'react'
import { GlobalModal } from '../../components/ui'
import { useTemplatesPage } from './hooks/useTemplatesPage'
import { TemplateGrid } from './components/TemplateGrid'
import { TemplateDetailModal } from './components/TemplateDetailModal'
import { TemplateFormModal } from './components/TemplateFormModal'

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

  return (
    <div className="page-container">
      <div className="dash-card">
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
      </div>

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
