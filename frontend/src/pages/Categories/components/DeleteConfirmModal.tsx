import React from 'react'
import { GlobalModal } from '../../../components/ui'
import type { Category } from '@family-bookkeeping/shared-types'
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  CONFIRM_DELETE_LOADING,
  confirmDeleteCategory,
} from '../../../utils/confirmCopy'

interface DeleteConfirmModalProps {
  deleteTarget: Category | null
  deleteMutation: { isPending: boolean }
  setDeleteTarget: (target: null) => void
  handleDeleteConfirm: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  deleteTarget,
  deleteMutation,
  setDeleteTarget,
  handleDeleteConfirm,
}) => {
  return (
    <GlobalModal
      type="confirm"
      open={!!deleteTarget}
      title={CONFIRM_DELETE_TITLE}
      children={confirmDeleteCategory(deleteTarget?.name || '')}
      onConfirm={handleDeleteConfirm}
      onClose={() => setDeleteTarget(null)}
      confirmText={deleteMutation.isPending ? CONFIRM_DELETE_LOADING : CONFIRM_DELETE_TEXT}
      loading={deleteMutation.isPending}
      confirmDanger
    />
  )
}