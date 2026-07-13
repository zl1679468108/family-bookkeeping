import React from 'react'
import { LocationPicker } from './components/LocationPicker'
import { TemplateSelector } from './components/TemplateSelector'
import { TransactionForm } from './components/TransactionForm'
import { ImageUploadSection } from './components/ImageUploadSection'
import { useTransactionForm } from './hooks/useTransactionForm'
import { Skeleton, FormSkeleton } from '../../components/ui/Skeleton'
import { LocationDisplay } from '../../components/ui/LocationDisplay'

const AddTransaction: React.FC = () => {
  const {
    isEditMode, editLoading,
    formData, setFormData,
    location, setLocation,
    showLocationPicker, setShowLocationPicker,
    savedImageUrls, pendingImages, allImageUrls,
    showTemplateSelector, setShowTemplateSelector,
    ocrProcessing, canAddMore,
    templates, categoryOptions,
    isSubmitting, fileInputRef, ocrFileInputRef,
    handleSubmit, handleTemplateConfirm, handleLocationConfirm,
    handleFileSelect, handleOcrSelect, handleRemoveSavedImage, handleRemovePendingImage, handleClearAllImages, handleReset,
  } = useTransactionForm()

  if (isEditMode && editLoading) {
    return (
      <div className="page-container">
        <div className="add-grid">
          <div className="add-left">
            <FormSkeleton fields={4} submitWidth={120} />
          </div>
          <div className="add-right">
            <Skeleton width="80%" height="20px" marginBottom="16px" />
            <Skeleton width="100%" height="60px" borderRadius="8px" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="add-grid">
        {/* 左侧：表单 */}
        <div className="add-left">
          <TransactionForm
            formData={formData}
            setFormData={setFormData}
            categoryOptions={categoryOptions}
          />

          <ImageUploadSection
            savedImageUrls={savedImageUrls}
            pendingImages={pendingImages}
            allImageUrls={allImageUrls}
            canAddMore={canAddMore}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onRemoveSaved={handleRemoveSavedImage}
            onRemovePending={handleRemovePendingImage}
            onClearAll={handleClearAllImages}
          />

          {/* 位置按钮 */}
          <div style={{ marginTop: 14 }}>
            <LocationDisplay
              locationName={location?.locationName}
              latitude={location?.latitude}
              longitude={location?.longitude}
              poiId={location?.poiId || undefined}
              onClick={() => setShowLocationPicker(true)}
              onClear={() => setLocation(null)}
              showButton={!location}
            />
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 14 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : isEditMode ? '保存修改' : '确认添加'}
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              重置
            </button>
          </div>
        </div>

        {/* 右侧：快捷方式 */}
        <div className="add-right">
          <h4>快捷方式</h4>
          <div className="sc-grid">
            <div className="sc-item" onClick={() => setShowTemplateSelector(true)}>
              <div className="sc-icon">📋</div>
              <div className="sc-name">选择模板</div>
              <div className="sc-desc">一键填充表单</div>
            </div>
            <div
              className="sc-item"
              onClick={() => ocrFileInputRef.current?.click()}
              style={{ opacity: ocrProcessing ? 0.6 : 1, pointerEvents: ocrProcessing ? 'none' : 'auto' }}
            >
              <div className="sc-icon">📷</div>
              <div className="sc-name">{ocrProcessing ? '识别中...' : 'OCR识别'}</div>
              <div className="sc-desc">拍照识别票据</div>
            </div>
          </div>
          {/* OCR 独立文件输入：单选，仅识别填充表单，不作为附件 */}
          <input
            ref={ocrFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleOcrSelect}
          />
        </div>
      </div>

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={location}
      />

      <TemplateSelector
        visible={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onConfirm={handleTemplateConfirm}
        templates={templates}
      />
    </div>
  )
}

export default AddTransaction
