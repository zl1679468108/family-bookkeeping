import React from 'react'
import { GlobalModal } from '../../../components/ui'
import { Button } from '../../../components/ui/Button'
import { FooterActions } from '../../../components/ui/FooterActions'
import { Input } from '../../../components/ui/Input'
import { IconGrid } from '../../../components/ui/IconGrid'
import type { CustomIconItem } from '../../../components/ui/IconGrid'
import { busyLabel, ACTION_SAVING } from '../../../utils/actionCopy'

interface CategoryFormModalProps {
  modalOpen: boolean
  modalTitle: string
  modalName: string
  modalIcon: string
  iconOptions: { value: string; icon: React.ReactNode; label?: string }[]
  customIconItems: CustomIconItem[]
  createMutation: { isPending: boolean }
  updateMutation: { isPending: boolean }
  setModalOpen: (open: boolean) => void
  setEditingCategory: (category: null) => void
  setModalName: (name: string) => void
  setModalIcon: (icon: string) => void
  handleModalConfirm: () => void
  handleIconUpload: (file: File, iconType: 'category' | 'book' | 'avatar') => Promise<void>
  handleIconDelete: (iconId: string) => Promise<void>
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  modalOpen,
  modalTitle,
  modalName,
  modalIcon,
  iconOptions,
  customIconItems,
  createMutation,
  updateMutation,
  setModalOpen,
  setEditingCategory,
  setModalName,
  setModalIcon,
  handleModalConfirm,
  handleIconUpload,
  handleIconDelete,
}) => {
  return (
    <GlobalModal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false)
        setEditingCategory(null)
      }}
      title={modalTitle}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
          <Button
            variant="secondary"
            onClick={() => {
              setModalOpen(false)
              setEditingCategory(null)
            }}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleModalConfirm}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {busyLabel(createMutation.isPending || updateMutation.isPending, ACTION_SAVING, '确认')}
          </Button>
        </FooterActions>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="名称"
          placeholder="输入分类名称"
          maxLength={10}
          value={modalName}
          onChange={(e) => setModalName(e.target.value)}
          autoFocus
          required
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: 'var(--fg3)' }}>图标</label>
          <IconGrid
            options={iconOptions}
            value={modalIcon}
            onChange={setModalIcon}
            customIcons={customIconItems}
            onUpload={handleIconUpload}
            onDelete={handleIconDelete}
            iconType="category"
          />
        </div>
      </div>
    </GlobalModal>
  )
}