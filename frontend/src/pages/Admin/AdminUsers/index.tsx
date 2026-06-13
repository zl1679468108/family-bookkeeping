import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../AdminLayout';
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
  UsersListResponse,
} from '../../../services/adminApi';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableRowsSkeleton } from '../../../components/ui/Skeleton';

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState<'user' | 'admin'>('user');
  const [selectedUserStatus, setSelectedUserStatus] = useState<'active' | 'suspended' | 'deleted'>('active');
  const [actionType, setActionType] = useState<'role' | 'status' | null>(null);
  
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, debouncedSearch, roleFilter, statusFilter],
    queryFn: () =>
      getAdminUsers({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role, pwd }: { userId: string; role: string; pwd: string }) =>
      updateUserRole(userId, role, pwd),
    onSuccess: () => {
      setActionType(null);
      setPassword('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status, pwd }: { userId: string; status: string; pwd: string }) =>
      updateUserStatus(userId, status, pwd),
    onSuccess: () => {
      setActionType(null);
      setPassword('');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const handleRoleSubmit = () => {
    if (!selectedUserId || !password) return;
    roleMutation.mutate({ userId: selectedUserId, role: selectedUserRole, pwd: password });
  };

  const handleStatusSubmit = () => {
    if (!selectedUserId || !password) return;
    statusMutation.mutate({ userId: selectedUserId, status: selectedUserStatus, pwd: password });
  };

  const openRoleDialog = (user: UsersListResponse['users'][number]) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.username);
    setSelectedUserRole(user.role === 'admin' ? 'user' : 'admin');
    setActionType('role');
  };

  const openStatusDialog = (user: UsersListResponse['users'][number]) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.username);
    setSelectedUserStatus(user.status === 'active' ? 'suspended' : 'active');
    setActionType('status');
  };

  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <AdminLayout>
      <div className="filter-sticky">
        <div className="filter-bar">
          <input
            type="text"
            className="form-input filter-bar__input"
            placeholder="搜索用户名/邮箱..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="form-input form-input--select"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部角色</option>
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
          <select
            className="form-input form-input--select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="suspended">停用</option>
            <option value="deleted">已注销</option>
          </select>
        </div>
      </div>

      <div className="card card--scrollable">
        {isLoading ? (
          <div className="data-table-wrapper">
            <TableRowsSkeleton columns={6} rows={10} />
          </div>
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th style={{ width: '100px' }}>头像</th>
                    <th style={{ width: '120px' }}>用户名</th>
                    <th>邮箱</th>
                    <th style={{ width: '100px' }}>角色</th>
                    <th style={{ width: '100px' }}>状态</th>
                    <th style={{ width: '200px' }}>注册时间</th>
                    <th className="data-table__col--fixed" style={{ width: '180px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users || []).map((user: UsersListResponse['users'][number]) => (
                    <tr key={user.id}>
                      <td className="data-table__cell--muted">{user.id}</td>
                      <td>
                        {user.avatar_url ? (
                          <img
                            className="avatar-thumb"
                            src={user.avatar_url}
                            alt={user.username}
                          />
                        ) : (
                          <span className="status status--muted">无</span>
                        )}
                      </td>
                      <td className="data-table__cell--primary">{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`tag ${user.role === 'admin' ? 'tag--primary' : 'tag--default'}`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            user.status === 'active'
                              ? 'status status--success'
                              : user.status === 'suspended'
                              ? 'status status--danger'
                              : 'status status--muted'
                          }
                        >
                          {user.status === 'active' ? '正常' : user.status === 'suspended' ? '停用' : '已注销'}
                        </span>
                      </td>
                      <td className="data-table__cell--muted">
                        {new Date(user.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="data-table__col--fixed">
                        <div className="action-buttons">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openRoleDialog(user)}
                          >
                            {user.role === 'admin' ? '降级' : '升级'}
                          </button>
                          <button
                            className={`btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => openStatusDialog(user)}
                          >
                            {user.status === 'active' ? '停用' : '启用'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-bar">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  上一页
                </button>
                <span className="page-info">
                  第 {page} / {totalPages} 页 · 共 {total} 条
                </span>
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={actionType === 'role'}
        title="修改用户角色"
        message={`确认将用户 ${selectedUserName} 的角色改为 ${selectedUserRole === 'admin' ? '管理员' : '普通用户'}？需要输入您的密码确认。`}
        confirmText="确认修改"
        onCancel={() => { setActionType(null); setPassword(''); setErrorMsg(''); }}
        onConfirm={handleRoleSubmit}
        loading={roleMutation.isPending}
      >
        <div style={{ marginTop: '12px' }}>
          <input
            type="password"
            className="form-input"
            placeholder="输入您的管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMsg && <div className="form-error">{errorMsg}</div>}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={actionType === 'status'}
        title="修改用户状态"
        message={`确认将用户 ${selectedUserName} 的状态改为 ${selectedUserStatus === 'active' ? '正常' : '停用'}？需要输入您的密码确认。`}
        confirmText="确认修改"
        onCancel={() => { setActionType(null); setPassword(''); setErrorMsg(''); }}
        onConfirm={handleStatusSubmit}
        loading={statusMutation.isPending}
      >
        <div style={{ marginTop: '12px' }}>
          <input
            type="password"
            className="form-input"
            placeholder="输入您的管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errorMsg && <div className="form-error">{errorMsg}</div>}
        </div>
      </ConfirmDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
