import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinByInvitation } from '../../../services/booksApi';
import { notify } from '../../../utils/notifications';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import './index.scss';

interface BookInviteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookInviteModal: React.FC<BookInviteModalProps> = ({ open, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    if (open) {
      setInviteCode('');
    }
  }, [open]);

  const joinMutation = useMutation({
    mutationFn: () => joinByInvitation(inviteCode.trim().toUpperCase(), { notifyOnError: false }),
    onSuccess: () => {
      notify({ type: 'success', message: '加入成功' });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      // api.ts 已在本请求关闭了 notifyOnError，这里是唯一的错误提示出口
      const msg = err?.message || '加入失败，请重试';
      notify({ type: 'error', message: Array.isArray(msg) ? msg[0] : msg });
    },
  });

  const handleSubmit = () => {
    if (inviteCode.trim().length < 4) return;
    joinMutation.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="使用邀请码加入"
      width={440}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmText={joinMutation.isPending ? '加入中...' : '加入账本'}
          confirmLoading={joinMutation.isPending}
          confirmDisabled={inviteCode.trim().length < 4}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Input
          label="邀请码"
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="例如 A3F8K2"
          maxLength={32}
          autoFocus
        />
        <p style={{ fontSize: '12px', color: 'var(--fg3)', margin: 0 }}>
          <strong>邀请码获取方式：</strong>由账主在「账本详情 → 生成邀请码」中生成，有效期为 7 天。
        </p>
      </div>
    </Modal>
  );
};

export default BookInviteModal;
