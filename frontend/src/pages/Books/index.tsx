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
        title="确认删除"
        children="确定删除？"
        onConfirm={() => deleteTarget && deleteMutation.run(deleteTarget)}
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
            removeMemberMutation.run({ bookId: selectedBook.id, userId: removingMember.id });
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
        title="切换账本"
        onConfirm={() => { if (switchTarget) { switchBook(switchTarget); setSwitchTarget(null); } }}
        onClose={() => setSwitchTarget(null)}
        confirmText="确认切换"
      >
        <div>
          <p>切换到账本 <strong>{switchTarget?.name}</strong> 后，以下模块数据将切换为该账本的维度：</p>
          <ul style={{ margin: '12px 0', paddingLeft: '20px', lineHeight: '1.8', color: 'var(--fg2)' }}>
            <li><strong>首页</strong> — 收支概览与预算进度</li>
            <li><strong>流水</strong> — 交易记录列表</li>
            <li><strong>报表</strong> — 统计图表与分类分析</li>
            <li><strong>日历</strong> — 日历视图中的交易</li>
            <li><strong>地图</strong> — 交易位置与商户聚合</li>
            <li><strong>模板</strong> — 快捷记账模板</li>
            <li><strong>预算</strong> — 预算设置与消耗</li>
            <li><strong>年报</strong> — 年度报告数据</li>
            <li><strong>导出</strong> — 账单导出</li>
          </ul>
          <p style={{ color: 'var(--fg3)', fontSize: '13px' }}>当前账本：{currentBook?.name}</p>
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
