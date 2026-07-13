import React from 'react'
import { Skeleton } from '../../components/ui/Skeleton'
import { Card } from '../../components/ui/Card'
import { CategoryHeader } from './components/CategoryHeader'
import { CategoryTabs } from './components/CategoryTabs'
import { CategoryList } from './components/CategoryList'
import { CategoryFormModal } from './components/CategoryFormModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { CategoryDetailModal } from './components/CategoryDetailModal'
import { useCategoriesPage } from './hooks/useCategoriesPage'
import './index.scss'

// ─── Main Page Component ──────────────────────────────────────────────────────

const Categories: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    modalOpen,
    setModalOpen,
    setEditingCategory,
    modalName,
    setModalName,
    modalIcon,
    setModalIcon,
    deleteTarget,
    setDeleteTarget,
    selectedCategory,
    setSelectedCategory,
    showDetail,
    setShowDetail,
    customCategories,
    isLoading,
    sortingMode,
    dragIndex,
    orderedList,
    handleEnterSortMode,
    handleSaveSort,
    handleCancelSort,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    isSaving,
    createMutation,
    updateMutation,
    deleteMutation,
    handleOpenAdd,
    handleOpenEdit,
    handleModalConfirm,
    handleDeleteConfirm,
    modalTitle,
    iconOptions,
    customIconItems,
    handleIconUpload,
    handleIconDelete,
  } = useCategoriesPage()

  return (
    <div className="page-container">
      <Card>
        {isLoading || !customCategories ? (
          <>
            <div className="cat-header-actions">
              <Skeleton width="90px" height="24px" borderRadius="6px" />
              <Skeleton width="90px" height="24px" borderRadius="6px" />
            </div>
            <div style={{ opacity: 0.6 }}>
              <div className="seg-control">
                <Skeleton width="70px" height="14px" />
                <Skeleton width="70px" height="14px" />
              </div>
            </div>
            <div className="cat-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="cat-card" style={{ pointerEvents: 'none' }}>
                  <div className="cat-header">
                    <div className="cat-e">
                      <Skeleton width="16px" height="16px" borderRadius="4px" />
                    </div>
                    <div className="cat-content">
                      <div className="cat-n">
                        <Skeleton width="70%" height="13px" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <CategoryHeader
              sortingMode={sortingMode}
              isSaving={isSaving}
              handleSaveSort={handleSaveSort}
              handleEnterSortMode={handleEnterSortMode}
              handleOpenAdd={handleOpenAdd}
            />

            <CategoryTabs
              activeTab={activeTab}
              sortingMode={sortingMode}
              handleCancelSort={handleCancelSort}
              setActiveTab={setActiveTab}
            />

            <CategoryList
              orderedList={orderedList}
              sortingMode={sortingMode}
              dragIndex={dragIndex}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
              setSelectedCategory={setSelectedCategory}
              setShowDetail={setShowDetail}
              onAdd={handleOpenAdd}
            />
          </>
        )}
      </Card>

      <CategoryFormModal
        modalOpen={modalOpen}
        modalTitle={modalTitle}
        modalName={modalName}
        modalIcon={modalIcon}
        iconOptions={iconOptions}
        customIconItems={customIconItems}
        createMutation={createMutation}
        updateMutation={updateMutation}
        setModalOpen={setModalOpen}
        setEditingCategory={setEditingCategory}
        setModalName={setModalName}
        setModalIcon={setModalIcon}
        handleModalConfirm={handleModalConfirm}
        handleIconUpload={handleIconUpload}
        handleIconDelete={handleIconDelete}
      />

      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        deleteMutation={deleteMutation}
        setDeleteTarget={setDeleteTarget}
        handleDeleteConfirm={handleDeleteConfirm}
      />

      <CategoryDetailModal
        selectedCategory={selectedCategory}
        showDetail={showDetail}
        setShowDetail={setShowDetail}
        setSelectedCategory={setSelectedCategory}
        setDeleteTarget={setDeleteTarget}
        handleOpenEdit={handleOpenEdit}
      />
    </div>
  )
}

export default Categories