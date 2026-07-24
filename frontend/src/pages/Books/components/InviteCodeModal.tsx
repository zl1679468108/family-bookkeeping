import React from 'react';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { FooterActions } from '../../../components/ui/FooterActions';
import type { InviteCodeData } from '../hooks/useBooksPage';
import { notifySuccess } from '../../../utils/notifyError'
import { formatDateTimeMinute } from '../../../utils/date'
import { SUCCESS_INVITE_COPIED, SUCCESS_INVITE_CODE_GENERATED } from '../../../utils/successCopy'
import { copyToClipboard } from '../../../utils/clipboard'
import { INVITE_CODE_SHARE_HINT_ONBOARDING, ACTION_COPY_INVITE_CODE } from '../../../utils/inviteCopy'

interface InviteCodeModalProps {
  open: boolean;
  inviteCode: InviteCodeData | null;
  onClose: () => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  open,
  inviteCode,
  onClose,
}) => {
  const handleCopy = () => {
    if (inviteCode) {
      void copyToClipboard(inviteCode.code)
      notifySuccess(SUCCESS_INVITE_COPIED);
    }
  };

  return (
    <GlobalModal
      open={open}
      onClose={onClose}
      title={SUCCESS_INVITE_CODE_GENERATED}
      width={460}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
          <Button variant="primary" onClick={handleCopy}>
            {ACTION_COPY_INVITE_CODE}
          </Button>
        </FooterActions>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '12px' }}>
          {INVITE_CODE_SHARE_HINT_ONBOARDING}
          <strong>「{inviteCode?.book_name}」</strong>
        </div>
        <div
          className="invite-code-display"
          onClick={handleCopy}
          style={{
            padding: '20px',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '4px',
            background: 'var(--bg)',
            border: '1px dashed var(--bd)',
            borderRadius: '10px',
            cursor: 'pointer',
            userSelect: 'all',
            color: 'var(--pr)',
          }}
        >
          {inviteCode?.code}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--fg3)', marginTop: '10px' }}>
          点击邀请码即可复制
          <br />
          有效期至：{inviteCode && formatDateTimeMinute(inviteCode.expires_at)}
        </div>
      </div>
    </GlobalModal>
  );
};
