import React, { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookCreateModal } from './BookCreateModal';
import { BookInviteModal } from './BookInviteModal';
import { useBook } from '../../hooks/useBook';
import { deleteBook, fetchBookMembers, removeMember, inviteMember, createInvitation } from '../../services/booksApi';
import { notify } from '../../utils/notifications';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card, CardHeader } from '../../components/ui/Card';
import { GlobalModal, DetailItem, Space } from '../../components/ui';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { getBookIconByKey } from '../../utils/bookIcons';
import './index.scss';

const DEFAULT_BOOK_NAME = '默认账本';

const BooksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentBook, switchBook, books, loading, refetchBooks } = useBook();
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteJoinModal, setShowInviteJoinModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showMemberConfirm, setShowMemberConfirm] = useState(false);
  const [removingMember, setRemovingMember] = useState<any>(null);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState<{ code: string; book_name: string; expires_at: string } | null>(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);

  // 统一关闭所有弹窗（操作成功后调用）
  const closeAllDialogs = () => {
    setShowDetail(false);
    setShowCreateModal(false);
    setShowInviteJoinModal(false);
    setShowInviteMemberModal(false);
    setShowInviteCodeModal(false);
    setShowMemberConfirm(false);
    setDeleteTarget(null);
    setEditTarget(null);
    setRemovingMember(null);
    setSelectedBook(null);
    setInviteEmail('');
    setGeneratedInviteCode(null);
  };

  // 获取账本成员
  const { data: members = [] } = useQuery({
    queryKey: ['book-members', selectedBook?.id],
    queryFn: () => (selectedBook?.id ? fetchBookMembers(selectedBook.id) : []),
    enabled: !!selectedBook?.id && showDetail,
    staleTime: 30 * 1000,
  });

  // 邀请成员
  const inviteMutation = useMutation({
    mutationFn: ({ bookId, email }: { bookId: string; email: string }) => inviteMember(bookId, email),
    onSuccess: () => {
      notify({ type: 'success', message: '邀请已发送' });
      closeAllDialogs();
      queryClient.invalidateQueries({ queryKey: ['book-members'] });
    },
  });

  // 生成邀请码
  const inviteCodeMutation = useMutation({
    mutationFn: (bookId: string) => createInvitation(bookId),
    onSuccess: (data) => {
      setGeneratedInviteCode(data);
      setShowInviteCodeModal(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      notify({ type: 'success', message: '账本已删除' });
      closeAllDialogs();
      refetchBooks();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ bookId, userId }: { bookId: string; userId: string }) => removeMember(bookId, userId),
    onSuccess: () => {
      notify({ type: 'success', message: '成员已移除' });
      queryClient.invalidateQueries({ queryKey: ['book-members'] });
      setShowMemberConfirm(false);
      setRemovingMember(null);
    },
  });

  const handleCreateSuccess = () => {
    refetchBooks();
    // 如果是从详情弹窗打开的编辑，编辑成功后关闭编辑弹窗和详情弹窗
    // 如果是创建新账本，只刷新列表即可
    if (editTarget) {
      setEditTarget(null);
      setShowDetail(false);
      setSelectedBook(null);
    }
  };

  const getIconNode = (iconKey: string | undefined): React.ReactNode => getBookIconByKey(iconKey);

  return (
    <div className="page-container">
      <section className="view-panel active">
        <Card>
          {loading ? (
            <>
              <CardHeader title={<Skeleton width="80px" height="14px" />} />
              <div className="bk-grid">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bk-card" style={{ pointerEvents: 'none' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Skeleton width="16px" height="16px" borderRadius="4px" />
                      <Skeleton width="60%" height="13px" />
                    </h4>
                    <div className="bk-meta">
                      <Skeleton width="50%" height="11px" />
                    </div>
                    <div className="bk-meta" style={{ marginTop: '3px' }}>
                      <Skeleton width="30%" height="11px" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <CardHeader
                title="我的账本"
                action={
                  <div className="bk-header-actions">
                    <Button variant="secondary" size="sm" onClick={() => setShowInviteJoinModal(true)}>
                      使用邀请码加入
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
                      + 新建账本
                    </Button>
                  </div>
                }
              />
              <div className="bk-grid">
                {books.length === 0 && (
                  <EmptyState
                    icon="📖"
                    title="还没有任何账本"
                    description="创建你的第一个账本，或等待他人邀请你加入。"
                  />
                )}
                {books.map((book: any) => {
                  const isActive = currentBook?.id === book.id;
                  return (
                    <div
                  key={book.id}
                  className={`bk-card ${isActive ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedBook(book);
                    setShowDetail(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="bk-header">
                    <span className="bk-icon">{getIconNode(book.icon)}</span>
                    <div className="bk-name">{book.name}</div>
                  </div>
                  <div className="bk-tags">
                    <span className="bk-tag">{book.m || 1} 成员</span>
                    <span className="bk-tag">{book.txn_count || 0} 笔交易</span>
                  </div>
                  {book.description && (
                    <div className="bk-desc">{book.description}</div>
                  )}
                </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </section>

      {/* 创建/编辑账本弹窗 —— 复用 BookCreateModal */}
      <BookCreateModal
        open={showCreateModal || !!editTarget}
        onClose={() => {
          // 只关闭创建/编辑弹窗，不关闭详情弹窗
          // 这样从详情弹窗打开的编辑弹窗关闭后，详情弹窗仍保留
          setShowCreateModal(false);
          setEditTarget(null);
        }}
        editTarget={
          editTarget
            ? {
                id: editTarget.id,
                name: editTarget.name,
                description: editTarget.description,
                icon: editTarget.icon,
              }
            : null
        }
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

      {/* 移除成员确认对话框 */}
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
        onClose={() => {
          setShowMemberConfirm(false);
          setRemovingMember(null);
        }}
        loading={removeMemberMutation.isPending}
        confirmText="确认移除"
        confirmDanger
      />

      {/* 账本详情弹窗 */}
      {selectedBook && (
        <GlobalModal
          type="detail"
          open={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedBook(null);
          }}
          title="账本详情"
          width={520}
          footer={
            <Space size="sm">
              <Button variant="secondary" onClick={() => setShowInviteMemberModal(true)}>
                邀请成员
              </Button>
              <Button
                variant="secondary"
                onClick={() => selectedBook?.id && inviteCodeMutation.mutate(selectedBook.id)}
                disabled={inviteCodeMutation.isPending}
              >
                {inviteCodeMutation.isPending ? '生成中...' : '生成邀请码'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditTarget(selectedBook);
                }}
              >
                编辑
              </Button>
              {selectedBook.name !== DEFAULT_BOOK_NAME && (
                <Button variant="danger" onClick={() => setDeleteTarget(selectedBook.id)}>
                  删除
                </Button>
              )}
              {currentBook?.id !== selectedBook.id && (
                <Button
                  variant="primary"
                  onClick={() => {
                    switchBook(selectedBook);
                    setShowDetail(false);
                    setSelectedBook(null);
                  }}
                >
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
              <DetailItem label="创建时间" value={format(new Date(selectedBook.created_at), 'yyyy-MM-dd HH:mm')} />
            )}
            {selectedBook.updated_at && (
              <DetailItem label="更新时间" value={format(new Date(selectedBook.updated_at), 'yyyy-MM-dd HH:mm')} />
            )}
            {selectedBook.owner_id && <DetailItem label="账主 ID" value={selectedBook.owner_id} />}
          </div>

          {/* 成员列表 */}
          {members.length > 0 && (
            <>
              <div className="detail-divider" />
              <div className="member-section">
                <div className="member-section-header">
                  <div className="member-section-title">成员明细</div>
                </div>
                <div className="member-list">
                  {members.map((member: any) => (
                    <div key={member.id} className="member-item">
                      <div className="member-info">
                        <div className="member-name">{member.username || member.email}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                      <div className="member-role">
                        {member.role === 'owner' && <span className="role-badge owner">账主</span>}
                        {member.role === 'admin' && <span className="role-badge admin">管理员</span>}
                        {member.role === 'member' && <span className="role-badge member">成员</span>}
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRemovingMember(member);
                              setShowMemberConfirm(true);
                            }}
                            title="移除成员"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </GlobalModal>
      )}

      {/* 邀请成员弹窗 */}
      <GlobalModal
        open={showInviteMemberModal && !!selectedBook}
        onClose={() => setShowInviteMemberModal(false)}
        title="邀请成员"
        width={400}
        footer={
          <div className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={() => setShowInviteMemberModal(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!inviteEmail.trim()) {
                  notify({ type: 'error', message: '请输入邮箱地址' });
                  return;
                }
                if (selectedBook) {
                  inviteMutation.mutate({ bookId: selectedBook.id, email: inviteEmail.trim() });
                }
              }}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? '发送中...' : '发送邀请'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Input
            label="邮箱地址"
            type="email"
            placeholder="请输入对方的邮箱"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            autoFocus
            required
          />
        </div>
      </GlobalModal>

      {/* 邀请码显示弹窗 */}
      <GlobalModal
        open={showInviteCodeModal && !!generatedInviteCode}
        onClose={() => setShowInviteCodeModal(false)}
        title="邀请码已生成"
        width={460}
        footer={
          <div className="global-modal-dialog__footer-inner">
            <Button
              variant="primary"
              onClick={() => {
                if (generatedInviteCode) {
                  navigator.clipboard?.writeText(generatedInviteCode.code);
                  notify({ type: 'success', message: '邀请码已复制' });
                }
              }}
            >
              复制邀请码
            </Button>
          </div>
        }
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '12px' }}>
            将以下邀请码分享给他人，对方注册并进入 /onboarding 页面后输入邀请码即可加入账本
            <strong>「{generatedInviteCode?.book_name}」</strong>
          </div>
          <div
            className="invite-code-display"
            onClick={() => {
              if (generatedInviteCode) {
                navigator.clipboard?.writeText(generatedInviteCode.code);
                notify({ type: 'success', message: '邀请码已复制' });
              }
            }}
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
            {generatedInviteCode?.code}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--fg3)', marginTop: '10px' }}>
            点击邀请码即可复制
            <br />
            有效期至：{generatedInviteCode && format(new Date(generatedInviteCode.expires_at), 'yyyy-MM-dd HH:mm')}
          </div>
        </div>
      </GlobalModal>

      {/* 邀请码加入弹窗 */}
      <BookInviteModal
        open={showInviteJoinModal}
        onClose={() => setShowInviteJoinModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default BooksPage;
