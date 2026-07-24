import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { joinByInvitation } from '../../../services/booksApi';
import { notify } from '../../../utils/notifications';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import './index.scss';
import { getErrorMessage } from '../../../utils/errorMessage'

interface BookInviteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookInviteModal: React.FC<BookInviteModalProps> = ({ open, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  // 防重复点击 + 超时兜底（双保险，接口卡死也能结束 loading）
  const joiningRef = useRef(false);

  useEffect(() => {
    if (open) {
      setInviteCode('');
      setJoining(false);
      joiningRef.current = false;
    }
  }, [open]);

  const resetJoining = () => {
    joiningRef.current = false;
    setJoining(false);
  };

  const handleSubmit = () => {
    const code = inviteCode.trim();
    if (code.length < 4) {
      notify({ type: 'error', message: '邀请码至少需要4位' });
      return;
    }
    if (joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);

    // 极端兜底：10s 后无论如何强制结束 loading
    const safetyTimer = window.setTimeout(() => {
      resetJoining();
    }, 10000);

    joinByInvitation(code.toUpperCase(), { notifyOnError: false })
      .then(() => {
        notify({ type: 'success', message: '加入成功' });
        queryClient.invalidateQueries({ queryKey: ['books'] });
        onClose();
        onSuccess?.();
      })
      .catch((err: any) => {
        const msg = getErrorMessage(err, '加入失败，请重试');
        notify({ type: 'error', message: Array.isArray(msg) ? msg[0] : msg });
      })
      .finally(() => {
        window.clearTimeout(safetyTimer);
        resetJoining();
      });
  };

  return (
    <GlobalModal
      open={open}
      onClose={onClose}
      title="使用邀请码加入"
      width={440}
      footer={
        <div className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={joining || inviteCode.trim().length < 4}
            >
              {joining ? '加入中...' : '加入账本'}
            </Button>
          </div>
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
          required
        />
        <p style={{ fontSize: '12px', color: 'var(--fg3)', margin: 0 }}>
          <strong>邀请码获取方式：</strong>由账主在「账本详情 → 生成邀请码」中生成，有效期为 7 天。
        </p>
      </div>
    </GlobalModal>
  );
};

export default BookInviteModal;
