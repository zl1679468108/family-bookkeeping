import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { fetchBooks, renameBook, deleteBook, fetchBookMembers } from '../../services/booksApi';
import { useIsOwner } from '../../hooks/useIsOwner';
import { notify } from '../../utils/notifications';

const BookSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOwner } = useIsOwner(id || null);

  const [renameValue, setRenameValue] = useState('');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: books = [] } = useQuery({
    queryKey: ['books'],
    queryFn: fetchBooks,
  });

  const currentBook = books.find((b: any) => b.id === id);

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameBook(id!, name),
    onSuccess: () => {
      notify({ type: 'success', message: '名称已更新' });
      setShowRenameDialog(false);
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBook(id!),
    onSuccess: () => {
      notify({ type: 'success', message: '账本已删除' });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      navigate('/books');
    },
  });

  if (!currentBook) {
    return (
      <div className="page-container">
        <Header title="账本设置" onBack={() => navigate('/books')} />
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          账本不存在
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header title="账本设置" onBack={() => navigate('/books')} />

      {/* 账本信息 */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>账本信息</h3>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
          名称：{currentBook.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          创建于 {new Date(currentBook.created_at).toLocaleDateString('zh-CN')}
        </div>
        {isOwner && (
          <Button
            variant="secondary"
            onClick={() => {
              setRenameValue(currentBook.name);
              setShowRenameDialog(true);
            }}
            style={{ marginTop: '16px', fontSize: '13px', padding: '6px 12px' }}
          >
            修改名称
          </Button>
        )}
      </div>

      {/* 成员管理 */}
      {isOwner && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>成员管理</h3>
          <Button
            onClick={() => navigate(`/books/${id}/members`)}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            管理成员
          </Button>
        </div>
      )}

      {/* 危险操作 */}
      {isOwner && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--danger)' }}>危险操作</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="danger"
              onClick={() => setShowDeleteDialog(true)}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              删除账本
            </Button>
          </div>
        </div>
      )}

      {/* 修改名称弹窗 */}
      {showRenameDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowRenameDialog(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              minWidth: 320,
              maxWidth: 420,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>修改账本名称</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新名称"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                fontSize: 14,
                marginBottom: 16,
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim()) {
                  renameMutation.mutate(renameValue.trim());
                }
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowRenameDialog(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--fg)',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => renameValue.trim() && renameMutation.mutate(renameValue.trim())}
                disabled={renameMutation.isPending || !renameValue.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: renameMutation.isPending || !renameValue.trim() ? 'var(--muted)' : 'var(--accent)',
                  color: '#fff',
                  cursor: renameMutation.isPending || !renameValue.trim() ? 'default' : 'pointer',
                  fontWeight: 600,
                  opacity: renameMutation.isPending || !renameValue.trim() ? 0.7 : 1,
                }}
              >
                {renameMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="确认删除"
        message="确定要删除该账本吗？账本内所有交易记录将被清除，此操作不可恢复。"
        confirmText="确认删除"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default BookSettingsPage;
