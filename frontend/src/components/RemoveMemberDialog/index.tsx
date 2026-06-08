import React, { useState } from 'react';
import { ConfirmDialog } from '../ConfirmDialog';
import { transferOwner } from '../../services/booksApi';
import { notify } from '../../utils/notifications';

interface RemoveMemberDialogProps {
  open: boolean;
  memberName: string;
  memberId: string;
  bookId: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 移除成员确认弹窗
 *
 * @example
 * <RemoveMemberDialog
 *   open={!!removeTarget}
 *   memberName={removeTarget.name}
 *   onClose={() => setRemoveTarget(null)}
 *   onConfirm={handleRemoveConfirm}
 *   loading={removeMutation.isPending}
 * />
 */
export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
  open,
  memberName,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <ConfirmDialog
      open={open}
      title="移除成员"
      message={`确定要移除「${memberName}」吗？移除后该成员将无法访问此账本的数据。`}
      confirmText="确认移除"
      confirmDanger={true}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
};
