import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useBook } from '../../hooks/useBook';
import { fetchBooks, createBook, renameBook, deleteBook, fetchBookMembers, inviteMember, leaveBook } from '../../services/booksApi';
import { notify } from '../../utils/notifications';
import { Skeleton } from '../../components/ui/Skeleton';

/** 默认账本不可删除 */
const DEFAULT_BOOK_NAME = '默认账本';

const BooksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentBook, switchBook } = useBook();
  const [newName, setNewName] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [inviteTarget, setInviteTarget] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [memberTarget, setMemberTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['books', 'members', memberTarget],
    queryFn: () => memberTarget ? fetchBookMembers(memberTarget) : Promise.resolve([]),
    enabled: !!memberTarget,
  });

  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      notify({ type: 'success', message: '账本创建成功' });
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameBook(id, name),
    onSuccess: () => {
      notify({ type: 'success', message: '重命名成功' });
      setRenameTarget(null);
      queryClient.invalidateQueries({ queryKey: ['books'] });
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

  const inviteMutation = useMutation({
    mutationFn: ({ bookId, email }: { bookId: string; email: string }) => inviteMember(bookId, email),
    onSuccess: () => {
      notify({ type: 'success', message: '添加成功' });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['books', 'members'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveBook,
    onSuccess: () => {
      notify({ type: 'success', message: '已退出账本' });
      setLeaveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', 'members'] });
    },
  });

  const renderBookCard = (book: any) => {
    const isActive = currentBook?.id === book.id;
    const isRenaming = renameTarget === book.id;
    const isDefault = book.name === DEFAULT_BOOK_NAME;

    return (
      <div
        key={book.id}
        style={{
          background: isActive ? 'oklch(58% 0.18 255 / 4%)' : 'var(--surface)',
          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isActive && <span style={{ color: 'var(--accent)', fontSize: '10px', fontWeight: 700 }}>●</span>}
            <span style={{ fontSize: '18px' }}>📖</span>

            {isRenaming ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  className="form-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  style={{ width: '150px', fontSize: '14px', padding: '4px 8px' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameValue.trim()) {
                      renameMutation.mutate({ id: book.id, name: renameValue.trim() });
                    }
                    if (e.key === 'Escape') setRenameTarget(null);
                  }}
                />
                <Button onClick={() => renameValue.trim() && renameMutation.mutate({ id: book.id, name: renameValue.trim() })}
                  disabled={renameMutation.isPending || !renameValue.trim()}
                  style={{ fontSize: '12px', padding: '4px 10px' }}>
                  保存
                </Button>
                <Button variant="secondary" onClick={() => setRenameTarget(null)}
                  style={{ fontSize: '12px', padding: '4px 10px' }}>
                  取消
                </Button>
              </div>
            ) : (
              <>
                <span
                  style={{ fontSize: '15px', fontWeight: 600, color: 'var(--fg)', cursor: 'pointer' }}
                  onClick={() => { setRenameTarget(book.id); setRenameValue(book.name); }}
                  title="点击修改名称"
                >
                  {book.name}
                </span>
                {isDefault && (
                  <span style={{
                    fontSize: '11px', color: 'var(--muted)',
                    background: 'var(--bg)', padding: '2px 8px', borderRadius: '10px',
                  }}>不可删除</span>
                )}
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  创建于 {new Date(book.created_at).toLocaleDateString('zh-CN')}
                </div>
              </>
            )}
          </div>

          {!isRenaming && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" onClick={() => switchBook(book)}
                style={{ fontSize: '12px', padding: '4px 12px' }} disabled={isActive}>
                切换到
              </Button>
              <Button variant="secondary" onClick={() => {
                setMemberTarget(memberTarget === book.id ? null : book.id); setInviteTarget(null);
              }} style={{ fontSize: '12px', padding: '4px 12px' }}>
                成员
              </Button>
              <Button variant="secondary" onClick={() => {
                setInviteTarget(inviteTarget === book.id ? null : book.id); setMemberTarget(null);
              }} style={{ fontSize: '12px', padding: '4px 12px' }}>
                邀请
              </Button>
              {!isDefault && (
                <Button variant="danger" onClick={() => setDeleteTarget(book.id)}
                  style={{ fontSize: '12px', padding: '4px 12px' }}>
                  删除
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 成员列表 */}
        {memberTarget === book.id && (
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            {members.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>暂无成员</div>
            ) : (
              members.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                  <span>{m.username || m.email}
                    {m.role === 'owner' && <span style={{ color: 'var(--accent)', marginLeft: 6, fontSize: 11 }}>所有者</span>}
                  </span>
                </div>
              ))
            )}
            {!isDefault && (
              <Button variant="secondary" onClick={() => setLeaveTarget(book.id)}
                style={{ fontSize: '12px', marginTop: 8, color: 'var(--danger)' }}>
                退出账本
              </Button>
            )}
          </div>
        )}

        {/* 邀请区域 */}
        {inviteTarget === book.id && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <input
              type="email" className="form-input" placeholder="输入用户邮箱"
              value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              style={{ flex: 1, fontSize: '13px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inviteEmail.trim()) {
                  inviteMutation.mutate({ bookId: book.id, email: inviteEmail.trim() });
                }
              }}
            />
            <Button onClick={() => inviteEmail.trim() && inviteMutation.mutate({ bookId: book.id, email: inviteEmail.trim() })}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
              style={{ fontSize: '13px' }}>
              {inviteMutation.isPending ? '添加中...' : '添加'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Header title="账本管理" />

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>创建新账本</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="text" className="form-input" placeholder="账本名称（如：家庭账本）"
            value={newName} onChange={(e) => setNewName(e.target.value)}
            maxLength={100} style={{ flex: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim()); }}
          />
          <Button onClick={() => newName.trim() && createMutation.mutate(newName.trim())}
            disabled={createMutation.isPending || !newName.trim()}>
            {createMutation.isPending ? '创建中...' : '创建'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderRadius: '12px', background: '#fff' }}>
              <Skeleton width="56px" height="56px" borderRadius="12px" />
              <div style={{ flex: 1, marginLeft: '16px', marginRight: '12px' }}>
                <Skeleton width="50%" height="16px" marginBottom="8px" />
                <Skeleton width="35%" height="13px" />
              </div>
              <Skeleton width="60px" height="14px" />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {books.map(renderBookCard)}
          {books.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>暂无账本</p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="确认删除"
        message="确定要删除该账本吗？账本内所有交易记录将被清除，此操作不可恢复。"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog open={!!leaveTarget} title="确认退出"
        message="确定要退出该账本吗？退出后将无法查看该账本的数据。"
        confirmText="确认退出"
        onConfirm={() => leaveTarget && leaveMutation.mutate(leaveTarget)}
        onCancel={() => setLeaveTarget(null)}
        loading={leaveMutation.isPending}
      />
    </div>
  );
};

export default BooksPage;
