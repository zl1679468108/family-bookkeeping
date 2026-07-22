import React from 'react'
import { GlobalModal } from '../../../components/ui'
import type { Category } from '@family-bookkeeping/shared-types'

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
      title="确认删除"
      children={`确定删除自定义分类「${deleteTarget?.name || ''}」吗？删除后不可恢复。`}
      onConfirm={handleDeleteConfirm}
      onClose={() => setDeleteTarget(null)}
      confirmText={deleteMutation.isPending ? '删除中...' : '确认删除'}
      loading={deleteMutation.isPending}
      confirmDanger
    />
  )
}