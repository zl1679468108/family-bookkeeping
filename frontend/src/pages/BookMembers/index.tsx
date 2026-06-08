import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RemoveMemberDialog } from '../../components/RemoveMemberDialog';
import { TransferOwnerDialog } from '../../components/TransferOwnerDialog';
import { fetchBookMembers, removeMember } from '../../services/booksApi';
import { useIsOwner } from '../../hooks/useIsOwner';
import { notify } from '../../utils/notifications';

const BookMembersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOwner } = useIsOwner(id || null);

  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['books', id, 'members'],
    queryFn: id ? () => fetchBookMembers(id) : () => Promise.resolve([]),
    enabled: !!id,
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(id!, memberId),
    onSuccess: () => {
      notify({ type: 'success', message: '成员已移除' });
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['books', id, 'members'] });
    },
  });

  const handleRemoveConfirm = () => {
    if (removeTarget) {
      removeMutation.mutate(removeTarget.id);
    }
  };

  const handleTransferSuccess = () => {
    notify({ type: 'success', message: '所有权转让成功' });
    setShowTransferDialog(false);
    queryClient.invalidateQueries({ queryKey: ['books'] });
    navigate('/books');
  };

  return (
    <div className="page-container">
      <Header
        title="成员管理"
        onBack={() => navigate('/books')}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          加载中...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {members.map((m: any) => (
            <div
              key={m.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {(m.username || m.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>
                    {m.username || '未命名用户'}
                    {m.role === 'owner' && (
                      <span style={{ color: 'var(--accent)', marginLeft: 6, fontSize: 11 }}>
                        所有者
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {m.email}
                  </div>
                </div>
              </div>

              {isOwner && m.role !== 'owner' && (
                <Button
                  variant="danger"
                  onClick={() => setRemoveTarget({ id: m.userId, name: m.username || m.email })}
                  style={{ fontSize: 13, padding: '6px 12px' }}
                >
                  移除
                </Button>
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              暂无成员
            </div>
          )}
        </div>
      )}

      {/* 转让所有权按钮（仅 Owner 可见） */}
      {isOwner && (
        <div style={{ marginTop: 24 }}>
          <Button
            variant="secondary"
            onClick={() => setShowTransferDialog(true)}
            style={{ width: '100%', padding: '12px' }}
          >
            转让账本所有权
          </Button>
        </div>
      )}

      {/* 移除成员确认弹窗 */}
      {removeTarget && (
        <RemoveMemberDialog
          open={!!removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={handleRemoveConfirm}
          memberName={removeTarget.name}
          memberId={removeTarget.id}
          bookId={id!}
          loading={removeMutation.isPending}
        />
      )}

      {/* 转让所有权弹窗 */}
      <TransferOwnerDialog
        open={showTransferDialog}
        onClose={() => setShowTransferDialog(false)}
        onConfirm={handleTransferSuccess}
        bookId={id!}
      />
    </div>
  );
};

export default BookMembersPage;
