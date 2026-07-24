import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { joinByInvitation } from '../../../services/booksApi';

import { notifyInfo, notifySuccess, notifyError } from '../../../utils/notifyError';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { FooterActions } from '../../../components/ui/FooterActions';
import { Input } from '../../../components/ui/Input';
import './index.scss';
import { getErrorMessage } from '../../../utils/errorMessage'
import { queryKeys } from '../../../utils/queryKeys'
import { INVITE_CODE_HELP_LABEL, INVITE_CODE_HELP_BODY } from '../../../utils/inviteCopy'
import { SUCCESS_JOINED } from '../../../utils/successCopy'
import { validateInviteCode, normalizeInviteCode } from '../../../utils/validation'
import { FORM_INVITE_CODE_EXAMPLE } from '../../../utils/formCopy'
import { TITLE_JOIN_BY_INVITE } from '../../../utils/sectionCopy'
import { FIELD_INVITE_CODE } from '../../../utils/fieldCopy'

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
    const code = normalizeInviteCode(inviteCode);
    const inviteErr = validateInviteCode(code);
    if (inviteErr) {
      notifyInfo(inviteErr);
      return;
    }
    if (joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);

    // 极端兜底：10s 后无论如何强制结束 loading
    const safetyTimer = window.setTimeout(() => {
      resetJoining();
    }, 10000);

    joinByInvitation(code, { notifyOnError: false })
      .then(() => {
        notifySuccess(SUCCESS_JOINED);
        queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
        onClose();
        onSuccess?.();
      })
      .catch((err: any) => {
        const msg = getErrorMessage(err, '加入失败，请重试');
        notifyError(Array.isArray(msg) ? msg[0] : msg);
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
      title={TITLE_JOIN_BY_INVITE}
      width={440}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={joining || inviteCode.trim().length < 4}
            >
              {joining ? '加入中...' : '加入账本'}
            </Button>
          </FooterActions>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Input
          label={FIELD_INVITE_CODE}
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder={FORM_INVITE_CODE_EXAMPLE}
          maxLength={32}
          autoFocus
          required
        />
        <p style={{ fontSize: '12px', color: 'var(--fg3)', margin: 0 }}>
          <strong>{INVITE_CODE_HELP_LABEL}</strong>{INVITE_CODE_HELP_BODY}
        </p>
      </div>
    </GlobalModal>
  );
};

export default BookInviteModal;
