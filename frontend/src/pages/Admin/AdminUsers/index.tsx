import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  getAdminUserDetail,
  UserDetail,
  UsersListResponse,
} from '../../../services/adminApi';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'deleted'>('active');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pageSize = 20;

  // 用户列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      getAdminUsers({
        page,
        pageSize,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  // 用户详情
  const { data: userDetail, isLoading: detailLoading } = useQuery<UserDetail>({
    queryKey: ['admin', 'user-detail', selectedUser],
    queryFn: () => getAdminUserDetail(selectedUser!),
    enabled: !!selectedUser,
  });

  // 修改角色
  const roleMutation = useMutation({
    mutationFn: ({ userId, role, pwd }: { userId: string; role: string; pwd: string }) =>
      updateUserRole(userId, role, pwd),
    onSuccess: () => {
      setShowRoleDialog(false);
      setPassword('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', selectedUser] });
      }
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  // 修改状态
  const statusMutation = useMutation({
    mutationFn: ({ userId, status, pwd }: { userId: string; status: string; pwd: string }) =>
      updateUserStatus(userId, status, pwd),
    onSuccess: () => {
      setShowStatusDialog(false);
      setPassword('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail', selectedUser] });
      }
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const handleRoleSubmit = () => {
    if (!selectedUser || !password) return;
    roleMutation.mutate({ userId: selectedUser, role: newRole, pwd: password });
  };

  const handleStatusSubmit = () => {
    if (!selectedUser || !password) return;
    statusMutation.mutate({ userId: selectedUser, status: newStatus, pwd: password });
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: '#1a1a1a' }}>👥 用户管理</h2>
        <div style={{ fontSize: '13px', color: '#888' }}>
          共 {data?.total || 0} 个用户
        </div>
      </div>

      {/* 筛选栏 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="搜索用户名/邮箱..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="">全部角色</option>
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="suspended">停用</option>
          <option value="deleted">已注销</option>
        </select>
      </div>

      {/* 用户表格 */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>加载中...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>用户名</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>角色</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>状态</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>注册时间</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((user: UsersListResponse['users'][number]) => (
                <tr
                  key={user.id}
                  style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{user.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: user.role === 'admin' ? '#07C160' : '#f0f0f0',
                        color: user.role === 'admin' ? '#fff' : '#666',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        color: user.status === 'active' ? '#07C160' : user.status === 'suspended' ? '#e74c3c' : '#999',
                        fontSize: '13px',
                      }}
                    >
                      {user.status === 'active' ? '正常' : user.status === 'suspended' ? '停用' : '已注销'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#999' }}>
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUser(user.id); }}
                      style={{
                        background: 'none',
                        border: '1px solid #07C160',
                        color: '#07C160',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      管理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                background: '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              上一页
            </button>
            <span style={{ padding: '6px 12px', fontSize: '14px', color: '#666' }}>
              {page} / {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              style={{
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                background: '#fff',
                cursor: page >= data.totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= data.totalPages ? 0.5 : 1,
              }}
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 用户详情弹窗 */}
      {selectedUser && userDetail && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>用户详情</h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: userDetail.avatar_url ? `url(${userDetail.avatar_url}) center/cover` : '#07C160',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 700,
                }}
              >
                {!userDetail.avatar_url && userDetail.username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{userDetail.username}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>{userDetail.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>角色</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {userDetail.role === 'admin' ? '管理员' : '普通用户'}
                </div>
              </div>
              <div style={{ background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>状态</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: userDetail.status === 'active' ? '#07C160' : '#e74c3c',
                  }}
                >
                  {userDetail.status === 'active' ? '正常' : userDetail.status === 'suspended' ? '停用' : '已注销'}
                </div>
              </div>
              <div style={{ background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>交易数</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{userDetail.stats.transactionCount}</div>
              </div>
              <div style={{ background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>账本数</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{userDetail.stats.bookCount}</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setNewRole(userDetail.role === 'admin' ? 'user' : 'admin'); setShowRoleDialog(true); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  background: userDetail.role === 'admin' ? '#fff3cd' : '#07C160',
                  color: userDetail.role === 'admin' ? '#856404' : '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {userDetail.role === 'admin' ? '👤 降级为普通用户' : '👑 提升为管理员'}
              </button>
              <button
                onClick={() => {
                  setNewStatus(userDetail.status === 'active' ? 'suspended' : 'active');
                  setShowStatusDialog(true);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  background: userDetail.status === 'active' ? '#f8d7da' : '#d4edda',
                  color: userDetail.status === 'active' ? '#721c24' : '#155724',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {userDetail.status === 'active' ? '🚫 停用账户' : '✅ 启用账户'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改角色弹窗 */}
      <ConfirmDialog
        open={showRoleDialog}
        title="修改用户角色"
        message={`确认将用户 ${userDetail?.username} 的角色改为 ${newRole === 'admin' ? '管理员' : '普通用户'}？需要输入您的密码确认。`}
        confirmText="确认修改"
        onCancel={() => { setShowRoleDialog(false); setPassword(''); setErrorMsg(''); }}
        onConfirm={handleRoleSubmit}
        loading={roleMutation.isPending}
      >
        <div style={{ marginTop: '12px' }}>
          <input
            type="password"
            placeholder="输入您的管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          {errorMsg && <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '8px' }}>{errorMsg}</div>}
        </div>
      </ConfirmDialog>

      {/* 修改状态弹窗 */}
      <ConfirmDialog
        open={showStatusDialog}
        title="修改用户状态"
        message={`确认将用户 ${userDetail?.username} 的状态改为 ${newStatus === 'active' ? '正常' : newStatus === 'suspended' ? '停用' : '已注销'}？需要输入您的密码确认。`}
        confirmText="确认修改"
        onCancel={() => { setShowStatusDialog(false); setPassword(''); setErrorMsg(''); }}
        onConfirm={handleStatusSubmit}
        loading={statusMutation.isPending}
      >
        <div style={{ marginTop: '12px' }}>
          <input
            type="password"
            placeholder="输入您的管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          {errorMsg && <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '8px' }}>{errorMsg}</div>}
        </div>
      </ConfirmDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
