import React from 'react';
import { format } from 'date-fns';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { notify } from '../../../utils/notifications';
import type { InviteCodeData } from '../hooks/useBooksPage';

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
      navigator.clipboard?.writeText(inviteCode.code);
      notify({ type: 'success', message: '邀请码已复制' });
    }
  };

  return (
    <GlobalModal
      open={open}
      onClose={onClose}
      title="邀请码已生成"
      width={460}
      footer={
        <div className="global-modal-dialog__footer-inner">
          <Button variant="primary" onClick={handleCopy}>
            复制邀请码
          </Button>
        </div>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '12px' }}>
          将以下邀请码分享给他人，对方注册并进入 /onboarding 页面后输入邀请码即可加入账本
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
            color: 'var(--accent, #4f9cfd)',
          }}
        >
          {inviteCode?.code}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--fg3)', marginTop: '10px' }}>
          点击邀请码即可复制
          <br />
          有效期至：{inviteCode && format(new Date(inviteCode.expires_at), 'yyyy-MM-dd HH:mm')}
        </div>
      </div>
    </GlobalModal>
  );
};
