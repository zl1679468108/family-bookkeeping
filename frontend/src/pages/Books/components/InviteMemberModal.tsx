import React from 'react';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { FooterActions } from '../../../components/ui/FooterActions';
import { Input } from '../../../components/ui/Input';
import { notifyError } from '../../../utils/notifyError'
import { validateEmail } from '../../../utils/validation'
import { FORM_EMAIL_REQUIRED, FORM_PEER_EMAIL_PLACEHOLDER } from '../../../utils/formCopy'
import { FIELD_EMAIL_ADDRESS } from '../../../utils/fieldCopy'

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
    const emailErr = validateEmail(inviteEmail, { emptyMessage: FORM_EMAIL_REQUIRED });
    if (emailErr) {
      notifyError(emailErr);
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
          label={FIELD_EMAIL_ADDRESS}
          type="email"
          placeholder={FORM_PEER_EMAIL_PLACEHOLDER}
          value={inviteEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          autoFocus
          required
        />
      </div>
    </GlobalModal>
  );
};
