import React, { useState } from 'react';
import { BookCreateModal } from './BookCreateModal';
import { BookInviteModal } from './BookInviteModal';
import { useBooksPage } from './hooks/useBooksPage';
import { BookGrid } from './components/BookGrid';
import { BookDetailModal } from './components/BookDetailModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { InviteCodeModal } from './components/InviteCodeModal';
import { GlobalModal } from '../../components/ui';
import './index.scss';
import { userDisplayName } from '../../utils/userDisplay'
import { ACTION_SWITCH_BOOK, ACTION_CONFIRM_SWITCH } from '../../utils/actionCopy'
import {
  CONFIRM_DELETE_TITLE,
  CONFIRM_DELETE_TEXT,
  CONFIRM_REMOVE_TITLE,
  CONFIRM_REMOVE_TEXT,
  confirmDeleteBook,
  confirmRemoveMember,
  SWITCH_BOOK_IMPACT_PREFIX,
  SWITCH_BOOK_IMPACT_SUFFIX,
  SWITCH_BOOK_IMPACT_PC,
  currentBookLabel,
} from '../../utils/confirmCopy'
import { ENTITY_BOOK_FALLBACK } from '../../utils/entityCopy'

const BooksPage: React.FC = () => {
  const {
    currentBook, switchBook, books, loading,
    selectedBook, setSelectedBook,
    showDetail, setShowDetail,
    showCreateModal, setShowCreateModal,
    showInviteJoinModal, setShowInviteJoinModal,
    editTarget, setEditTarget,
    deleteTarget, setDeleteTarget,
    showMemberConfirm, setShowMemberConfirm,
    removingMember, setRemovingMember,
    showInviteMemberModal, setShowInviteMemberModal,
    inviteEmail, setInviteEmail,
    generatedInviteCode, showInviteCodeModal, setShowInviteCodeModal,
    members,
    membersLoading,
    inviteMutation, inviteCodeMutation,
    deleteMutation, removeMemberMutation,
    handleCreateSuccess, handleGenerateInviteCode,
  } = useBooksPage();

  const [switchTarget, setSwitchTarget] = useState<any>(null);

  return (
    <div className="page-container">
      <section className="view-panel active">
        <BookGrid
          loading={loading}
          books={books}
          currentBook={currentBook}
          onSelectBook={(book) => { setSelectedBook(book); setShowDetail(true); }}
          onCreateNew={() => setShowCreateModal(true)}
          onJoinByCode={() => setShowInviteJoinModal(true)}
        />
      </section>

      <BookCreateModal
        open={showCreateModal || !!editTarget}
        onClose={() => { setShowCreateModal(false); setEditTarget(null); }}
        editTarget={editTarget ? { id: editTarget.id, name: editTarget.name, description: editTarget.description, icon: editTarget.icon } : null}
        onSuccess={handleCreateSuccess}
      />

      <GlobalModal
        type="confirm"
        open={!!deleteTarget}
        title={CONFIRM_DELETE_TITLE}
        children={confirmDeleteBook(selectedBook?.name || books?.find((b: any) => b.id === deleteTarget)?.name || ENTITY_BOOK_FALLBACK)}
        onConfirm={() => deleteTarget && deleteMutation.run(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        confirmText={CONFIRM_DELETE_TEXT}
        confirmDanger
      />

      <GlobalModal
        type="confirm"
        open={showMemberConfirm}
        title={CONFIRM_REMOVE_TITLE}
        children={confirmRemoveMember(userDisplayName(removingMember))}
        onConfirm={() => {
          if (removingMember && selectedBook) {
            removeMemberMutation.run({ bookId: selectedBook.id, userId: removingMember.id });
          }
        }}
        onClose={() => { setShowMemberConfirm(false); setRemovingMember(null); }}
        loading={removeMemberMutation.isPending}
        confirmText={CONFIRM_REMOVE_TEXT}
        confirmDanger
      />

      <BookDetailModal
        open={showDetail}
        selectedBook={selectedBook}
        currentBook={currentBook}
        members={members}
        loadingMembers={membersLoading}
        isGenerateInviteCodePending={inviteCodeMutation.isPending}
        onClose={() => { setShowDetail(false); setSelectedBook(null); }}
        onInviteMember={() => setShowInviteMemberModal(true)}
        onGenerateInviteCode={() => selectedBook?.id && handleGenerateInviteCode(selectedBook.id)}
        onEdit={() => setEditTarget(selectedBook)}
        onDelete={() => setDeleteTarget(selectedBook?.id)}
        onSwitchBook={() => { setSwitchTarget(selectedBook); setShowDetail(false); setSelectedBook(null); }}
        onRemoveMember={(member) => { setRemovingMember(member); setShowMemberConfirm(true); }}
      />

      <GlobalModal
        type="confirm"
        open={!!switchTarget}
        title={ACTION_SWITCH_BOOK}
        onConfirm={() => { if (switchTarget) { switchBook(switchTarget); setSwitchTarget(null); } }}
        onClose={() => setSwitchTarget(null)}
        confirmText={ACTION_CONFIRM_SWITCH}
      >
        <div>
          <p>{SWITCH_BOOK_IMPACT_PREFIX}<strong>{switchTarget?.name}</strong>{SWITCH_BOOK_IMPACT_SUFFIX}</p>
          <ul style={{ margin: '12px 0', paddingLeft: '20px', lineHeight: '1.8', color: 'var(--fg2)' }}>
            {SWITCH_BOOK_IMPACT_PC.map((item) => (
              <li key={item.label}><strong>{item.label}</strong> — {item.desc}</li>
            ))}
          </ul>
          <p style={{ color: 'var(--fg3)', fontSize: '13px' }}>{currentBookLabel(currentBook?.name || '')}</p>
        </div>
      </GlobalModal>

      <InviteMemberModal
        open={showInviteMemberModal && !!selectedBook}
        selectedBook={selectedBook}
        inviteEmail={inviteEmail}
        onEmailChange={setInviteEmail}
        onClose={() => setShowInviteMemberModal(false)}
        onInvite={(bookId, email) => inviteMutation.run({ bookId, email })}
        isPending={inviteMutation.isPending}
      />

      <InviteCodeModal
        open={showInviteCodeModal && !!generatedInviteCode}
        inviteCode={generatedInviteCode}
        onClose={() => setShowInviteCodeModal(false)}
      />

      <BookInviteModal
        open={showInviteJoinModal}
        onClose={() => setShowInviteJoinModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default BooksPage;
