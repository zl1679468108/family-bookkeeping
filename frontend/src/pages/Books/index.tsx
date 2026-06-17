import React from 'react';
import { BookCreateModal } from './BookCreateModal';
import { BookInviteModal } from './BookInviteModal';
import { useBooksPage } from './hooks/useBooksPage';
import { BookGrid } from './components/BookGrid';
import { BookDetailModal } from './components/BookDetailModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { InviteCodeModal } from './components/InviteCodeModal';
import { GlobalModal } from '../../components/ui';
import './index.scss';

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
    inviteMutation, inviteCodeMutation,
    deleteMutation, removeMemberMutation,
    handleCreateSuccess,
  } = useBooksPage();

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
        title="确认删除"
        children="确定删除？"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
        confirmText="确认删除"
        confirmDanger
      />

      <GlobalModal
        type="confirm"
        open={showMemberConfirm}
        title="确认移除"
        children={`确定要移除成员 ${removingMember?.username || removingMember?.email}？`}
        onConfirm={() => {
          if (removingMember && selectedBook) {
            removeMemberMutation.mutate({ bookId: selectedBook.id, userId: removingMember.id });
          }
        }}
        onClose={() => { setShowMemberConfirm(false); setRemovingMember(null); }}
        loading={removeMemberMutation.isPending}
        confirmText="确认移除"
        confirmDanger
      />

      <BookDetailModal
        open={showDetail}
        selectedBook={selectedBook}
        currentBook={currentBook}
        members={members}
        inviteCodeMutationPending={inviteCodeMutation.isPending}
        onClose={() => { setShowDetail(false); setSelectedBook(null); }}
        onInviteMember={() => setShowInviteMemberModal(true)}
        onGenerateInviteCode={() => selectedBook?.id && inviteCodeMutation.mutate(selectedBook.id)}
        onEdit={() => setEditTarget(selectedBook)}
        onDelete={() => setDeleteTarget(selectedBook?.id)}
        onSwitchBook={() => { switchBook(selectedBook); setShowDetail(false); setSelectedBook(null); }}
        onRemoveMember={(member) => { setRemovingMember(member); setShowMemberConfirm(true); }}
      />

      <InviteMemberModal
        open={showInviteMemberModal && !!selectedBook}
        selectedBook={selectedBook}
        inviteEmail={inviteEmail}
        onEmailChange={setInviteEmail}
        onClose={() => setShowInviteMemberModal(false)}
        onInvite={(bookId, email) => inviteMutation.mutate({ bookId, email })}
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
