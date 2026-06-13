import React, { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { BookCreateModal } from '../../components/BookCreateModal';
import { useBook } from '../../hooks/useBook';
import { fetchBooks, deleteBook, fetchBookMembers, removeMember, inviteMember, createInvitation } from '../../services/booksApi';
import { notify } from '../../utils/notifications';
import { Skeleton } from '../../components/ui/Skeleton';
import { DetailModal } from '../../components/DetailModal';
import { getBookIconByKey, getBookEmojiByKey } from '../../utils/bookIcons';
import './index.scss';

const DEFAULT_BOOK_NAME = '默认账本';

const BooksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentBook, switchBook } = useBook();
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showMemberConfirm, setShowMemberConfirm] = useState(false);
  const [removingMember, setRemovingMember] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteCode, setGeneratedInviteCode] = useState<{ code: string; book_name: string; expires_at: string } | null>(null);
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  });

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
      setShowInviteModal(false);
      setInviteEmail('');
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
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['books'] });
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
    queryClient.invalidateQueries({ queryKey: ['books'] });
  };

  const getIconNode = (iconKey: string | undefined): React.ReactNode => getBookIconByKey(iconKey);

  return (
    <div className="page-container">
      <section className="view-panel active">
        <div className="dash-card">
          {isLoading ? (
            <>
              <div className="card-header">
                <Skeleton width="80px" height="14px" />
              </div>
              <div className="bk-grid">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bk-card" style={{ opacity: 0.7 }}>
                    <Skeleton width="40%" height="14px" marginBottom="4px" />
                    <Skeleton width="70%" height="11px" marginBottom="3px" />
                    <Skeleton width="55%" height="10px" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="card-header">
                <h3>我的账本</h3>
              </div>
              <div className="bk-grid">
                {books.length === 0 && (
                  <div className="bk-empty-state">
                    <div className="bk-empty-state__icon">📖</div>
                    <div className="bk-empty-state__title">还没有任何账本</div>
                    <div className="bk-empty-state__desc">创建你的第一个账本，或等待他人邀请你加入。</div>
                  </div>
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
                      <h4>
                        <span className="bk-icon">{getIconNode(book.icon)}</span> {book.name}
                      </h4>
                      <div className="bk-meta">{book.m || 1} 成员 · {book.txn_count || 0} 笔</div>
                      <div className="bk-meta bk-desc" style={{ marginTop: '3px', fontSize: '11px' }}>
                        {book.description || '新创建'}
                      </div>
                    </div>
                  );
                })}

                <div className="bk-card add-new" onClick={() => setShowCreateModal(true)}>
                  + 新账本
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 创建/编辑账本弹窗 —— 复用 BookCreateModal */}
      <BookCreateModal
        open={showCreateModal || !!editTarget}
        onClose={() => {
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除"
        message="确定删除？"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />

      {/* 移除成员确认对话框 */}
      <ConfirmDialog
        open={showMemberConfirm}
        title="确认移除"
        message={`确定要移除成员 ${removingMember?.username || removingMember?.email}？`}
        onConfirm={() => {
          if (removingMember) {
            removeMemberMutation.mutate({ bookId: selectedBook.id, userId: removingMember.id });
          }
        }}
        onCancel={() => {
          setShowMemberConfirm(false);
          setRemovingMember(null);
        }}
        loading={removeMemberMutation.isPending}
      />

      {/* 账本详情弹窗 */}
      {selectedBook && (
        <DetailModal
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          title="账本详情"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)}>
                邀请成员
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => selectedBook?.id && inviteCodeMutation.mutate(selectedBook.id)}
                disabled={inviteCodeMutation.isPending}
              >
                {inviteCodeMutation.isPending ? '生成中...' : '生成邀请码'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditTarget(selectedBook);
                  setShowDetail(false);
                  setShowCreateModal(false);
                }}
              >
                编辑
              </button>
              {selectedBook.name !== DEFAULT_BOOK_NAME && (
                <button
                  className="btn btn-danger"
                  onClick={() => setDeleteTarget(selectedBook.id)}
                >
                  删除
                </button>
              )}
              {currentBook?.id !== selectedBook.id && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    switchBook(selectedBook);
                    setShowDetail(false);
                  }}
                >
                  切换到此账本
                </button>
              )}
            </>
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
            <div className="detail-item">
              <span className="detail-item-label">成员</span>
              <span className="detail-item-value">{members.length || selectedBook.m || 1} 人</span>
            </div>
            <div className="detail-item">
              <span className="detail-item-label">交易笔数</span>
              <span className="detail-item-value">{selectedBook.txn_count || 0} 笔</span>
            </div>
            {selectedBook.is_archived && (
              <div className="detail-item">
                <span className="detail-item-label">状态</span>
                <span className="detail-item-value">已归档</span>
              </div>
            )}
            {selectedBook.created_at && (
              <div className="detail-item">
                <span className="detail-item-label">创建时间</span>
                <span className="detail-item-value">{format(new Date(selectedBook.created_at), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            )}
            {selectedBook.updated_at && (
              <div className="detail-item">
                <span className="detail-item-label">更新时间</span>
                <span className="detail-item-value">{format(new Date(selectedBook.updated_at), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            )}
            {selectedBook.owner_id && (
              <div className="detail-item">
                <span className="detail-item-label">账主 ID</span>
                <span className="detail-item-value">{selectedBook.owner_id}</span>
              </div>
            )}
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
                          <button
                            className="btn-remove-member"
                            onClick={() => {
                              setRemovingMember(member);
                              setShowMemberConfirm(true);
                            }}
                            title="移除成员"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DetailModal>
      )}

      {/* 邀请成员弹窗 */}
      {showInviteModal && selectedBook && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>邀请成员</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>邮箱地址</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="请输入对方的邮箱"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!inviteEmail.trim()) {
                    notify({ type: 'error', message: '请输入邮箱地址' });
                    return;
                  }
                  inviteMutation.mutate({ bookId: selectedBook.id, email: inviteEmail.trim() });
                }}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? '发送中...' : '发送邀请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 邀请码显示弹窗 */}
      {showInviteCodeModal && generatedInviteCode && (
        <div className="modal-overlay" onClick={() => setShowInviteCodeModal(false)}>
          <div
            className="modal-content invite-code-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', textAlign: 'center' }}
          >
            <div className="modal-header">
              <h3>邀请码已生成</h3>
              <button className="modal-close" onClick={() => setShowInviteCodeModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '12px' }}>
                将以下邀请码分享给他人，对方注册并进入 /onboarding 页面后输入邀请码即可加入账本
                <strong>「{generatedInviteCode.book_name}」</strong>
              </div>
              <div
                className="invite-code-display"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedInviteCode.code);
                  notify({ type: 'success', message: '邀请码已复制' });
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
                {generatedInviteCode.code}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--fg3)', marginTop: '10px' }}>
                点击邀请码即可复制
                <br />
                有效期至：{format(new Date(generatedInviteCode.expires_at), 'yyyy-MM-dd HH:mm')}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedInviteCode.code);
                  notify({ type: 'success', message: '邀请码已复制' });
                }}
              >
                复制邀请码
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksPage;
