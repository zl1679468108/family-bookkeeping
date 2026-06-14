import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinByInvitation } from '../../../services/booksApi';
import { notify } from '../../../utils/notifications';
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

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim().length < 4) return;
    joinMutation.mutate();
  };

  return (
    <div className="modal-overlay book-invite-overlay" onClick={onClose}>
      <div className="book-invite-content" onClick={(e) => e.stopPropagation()}>
        <div className="book-invite-header">
          <h3>使用邀请码加入</h3>
          <button className="book-invite-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="book-invite-body">
            <div className="book-invite-form-group">
              <label>邀请码</label>
              <div className="book-invite-input-wrapper">
                <input
                  type="text"
                  className="book-invite-input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="例如 A3F8K2"
                  maxLength={32}
                  autoFocus
                />
              </div>
            </div>
            <p className="book-invite-form-tip">
              <strong>邀请码获取方式：</strong>由账主在「账本详情 → 生成邀请码」中生成，有效期为 7 天。
            </p>
          </div>
          <div className="book-invite-footer">
            <button type="button" className="book-invite-btn book-invite-btn--secondary" onClick={onClose}>
              取消
            </button>
            <button
              type="submit"
              className="book-invite-btn book-invite-btn--primary"
              disabled={joinMutation.isPending || inviteCode.trim().length < 4}
            >
              {joinMutation.isPending ? '加入中...' : '加入账本'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookInviteModal;
