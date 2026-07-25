import React from 'react';
import { GlobalModal, DetailItem, FooterActions } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { getBookIconByKey } from '../../../utils/bookIcons';
import { BookMemberList } from './BookMemberList';
import { formatDateTimeMinute } from '../../../utils/date'
import { DETAIL_BOOK, DEFAULT_BOOK_NAME, LABEL_ARCHIVED, memberCountLabel, transactionCountLabel } from '../../../utils/entityCopy'
import { FIELD_MEMBERS, FIELD_TXN_COUNT, FIELD_STATUS, FIELD_CREATED_AT, FIELD_UPDATED_AT, FIELD_OWNER_ID } from '../../../utils/fieldCopy'
import { ACTION_EDIT, ACTION_DELETE, generatingLabel, ACTION_INVITE_MEMBER, ACTION_SWITCH_TO_BOOK } from '../../../utils/actionCopy'
import { ACTION_GENERATE_INVITE_CODE } from '../../../utils/inviteCopy'
import { FORM_NEWLY_CREATED } from '../../../utils/formCopy'

interface BookDetailModalProps {
  open: boolean;
  selectedBook: any;
  currentBook: any;
  members: any[];
  loadingMembers?: boolean;
  isGenerateInviteCodePending: boolean;
  onClose: () => void;
  onInviteMember: () => void;
  onGenerateInviteCode: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSwitchBook: () => void;
  onRemoveMember: (member: any) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  open,
  selectedBook,
  currentBook,
  members,
  loadingMembers,
  isGenerateInviteCodePending,
  onClose,
  onInviteMember,
  onGenerateInviteCode,
  onEdit,
  onDelete,
  onSwitchBook,
  onRemoveMember,
}) => {
  const getIconNode = (iconKey: string | undefined): React.ReactNode => getBookIconByKey(iconKey);

  if (!selectedBook) return null;

  return (
    <GlobalModal
      type="detail"
      open={open}
      onClose={onClose}
      title={DETAIL_BOOK}
      width={520}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
          <Button variant="secondary" onClick={onInviteMember}>
            {ACTION_INVITE_MEMBER}
          </Button>
          <Button
            variant="secondary"
            onClick={onGenerateInviteCode}
            disabled={isGenerateInviteCodePending}
          >
            {generatingLabel(isGenerateInviteCodePending, ACTION_GENERATE_INVITE_CODE)}
          </Button>
          <Button variant="secondary" onClick={onEdit}>{ACTION_EDIT}</Button>
          {selectedBook.name !== DEFAULT_BOOK_NAME && (
            <Button variant="danger" onClick={onDelete}>{ACTION_DELETE}</Button>
          )}
          {currentBook?.id !== selectedBook.id && (
            <Button variant="primary" onClick={onSwitchBook}>
              {ACTION_SWITCH_TO_BOOK}
            </Button>
          )}
        </FooterActions>
      }
    >
      <div className="detail-content-wrapper">
        <div className="detail-icon">{getIconNode(selectedBook.icon)}</div>
        <div className="detail-content">
          <div className="detail-title">{selectedBook.name}</div>
          <div className="detail-subtitle">{selectedBook.description || FORM_NEWLY_CREATED}</div>
        </div>
      </div>
      <div className="detail-divider" />
      <div className="detail-grid">
        <DetailItem label={FIELD_MEMBERS} value={memberCountLabel(members.length || selectedBook.m || 1)} />
        <DetailItem label={FIELD_TXN_COUNT} value={transactionCountLabel(selectedBook.txn_count || 0)} />
        {selectedBook.is_archived && <DetailItem label={FIELD_STATUS} value={LABEL_ARCHIVED} />}
        {selectedBook.created_at && (
          <DetailItem label={FIELD_CREATED_AT} value={formatDateTimeMinute(selectedBook.created_at)} />
        )}
        {selectedBook.updated_at && (
          <DetailItem label={FIELD_UPDATED_AT} value={formatDateTimeMinute(selectedBook.updated_at)} />
        )}
        {selectedBook.owner_id && <DetailItem label={FIELD_OWNER_ID} value={selectedBook.owner_id} />}
      </div>
      <BookMemberList
        members={members}
        loading={loadingMembers}
        onRemoveMember={onRemoveMember}
        onInvite={onInviteMember}
      />
    </GlobalModal>
  );
};
