import React from 'react';
import { GlobalModal, DetailItem, Space } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { getBookIconByKey } from '../../../utils/bookIcons';
import { BookMemberList } from './BookMemberList';
import { formatDateTimeMinute } from '../../../utils/date'
import { DETAIL_BOOK } from '../../../utils/entityCopy'

const DEFAULT_BOOK_NAME = '默认账本';

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
        <Space size="sm">
          <Button variant="secondary" onClick={onInviteMember}>
            邀请成员
          </Button>
          <Button
            variant="secondary"
            onClick={onGenerateInviteCode}
            disabled={isGenerateInviteCodePending}
          >
            {isGenerateInviteCodePending ? '生成中...' : '生成邀请码'}
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            编辑
          </Button>
          {selectedBook.name !== DEFAULT_BOOK_NAME && (
            <Button variant="danger" onClick={onDelete}>
              删除
            </Button>
          )}
          {currentBook?.id !== selectedBook.id && (
            <Button variant="primary" onClick={onSwitchBook}>
              切换到此账本
            </Button>
          )}
        </Space>
      }
    >
      <div className="detail-content-wrapper">
        <div className="detail-icon">{getIconNode(selectedBook.icon)}</div>
        <div className="detail-content">
          <div className="detail-title">{selectedBook.name}</div>
          <div className="detail-subtitle">{selectedBook.description || '新创建'}</div>
        </div>
      </div>
      <div className="detail-divider" />
      <div className="detail-grid">
        <DetailItem label="成员" value={`${members.length || selectedBook.m || 1} 人`} />
        <DetailItem label="交易笔数" value={`${selectedBook.txn_count || 0} 笔`} />
        {selectedBook.is_archived && <DetailItem label="状态" value="已归档" />}
        {selectedBook.created_at && (
          <DetailItem label="创建时间" value={formatDateTimeMinute(selectedBook.created_at)} />
        )}
        {selectedBook.updated_at && (
          <DetailItem label="更新时间" value={formatDateTimeMinute(selectedBook.updated_at)} />
        )}
        {selectedBook.owner_id && <DetailItem label="账主 ID" value={selectedBook.owner_id} />}
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
