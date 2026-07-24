import React from 'react';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { FooterActions } from '../../../components/ui/FooterActions';
import { Input } from '../../../components/ui/Input';
;
import { notifyError } from '../../../utils/notifyError'
import { FORM_EMAIL_REQUIRED } from '../../../utils/formCopy'

interface InviteMemberModalProps {
  open: boolean;
  selectedBook: any;
  inviteEmail: string;
  onEmailChange: (email: string) => void;
  onClose: () => void;
  onInvite: (bookId: string, email: string) => void;
  isPending: boolean;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  selectedBook,
  inviteEmail,
  onEmailChange,
  onClose,
  onInvite,
  isPending,
}) => {
  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      notifyError(FORM_EMAIL_REQUIRED);
      return;
    }
    if (selectedBook) {
      onInvite(selectedBook.id, inviteEmail.trim());
    }
  };

  return (
    <GlobalModal
      open={open}
      onClose={onClose}
      title="邀请成员"
      width={400}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button
            variant="primary"
            onClick={handleInvite}
            disabled={isPending}
          >
            {isPending ? '发送中...' : '发送邀请'}
          </Button>
        </FooterActions>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Input
          label="邮箱地址"
          type="email"
          placeholder="请输入对方的邮箱"
          value={inviteEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          autoFocus
          required
        />
      </div>
    </GlobalModal>
  );
};
