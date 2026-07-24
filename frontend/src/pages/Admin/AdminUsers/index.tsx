import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, updateUserRole, updateUserStatus, UsersListResponse } from '../../../services/adminApi'
import AdminLayout from '../AdminLayout'
import { GlobalModal } from '../../../components/ui'
import { useMutationAction } from '../../../hooks/useMutationAction'
import { useDebounce } from '../../../hooks/useDebounce'
import { FilterBar } from '../../../components/ui/FilterBar'
import { SearchInput, Input } from '../../../components/ui/Input'
import { DropdownSelect } from '../../../components/ui/Dropdown'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Pagination } from '../../../components/ui/Pagination'
import { EmptyState } from '../../../components/ui/EmptyState'
import { TableRowsSkeleton } from '../../../components/ui/Skeleton'
import { formatDateTime } from '../../../utils/date';
import { platformUserRoleLabel, isPlatformAdmin } from '../../../utils/roles'
import { queryKeys } from '../../../utils/queryKeys'
import { STALE } from '../../../utils/cachePolicy'

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

  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.users(page, debouncedSearch, roleFilter, statusFilter, pageSize),
    queryFn: () =>
      getAdminUsers({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const roleMutation = useMutationAction(
    ({ userId, role, pwd }: { userId: string; role: string; pwd: string }) =>
      updateUserRole(userId, role, pwd),
    {
      invalidateKeys: [queryKeys.admin.all],
      errorMessage: '修改角色失败',
      onSuccess: () => {
        setActionType(null);
        setPassword('');
        setErrorMsg('');
      },
      onError: (err: unknown) => setErrorMsg(err instanceof Error ? err.message : String(err)),
    },
  );

  const statusMutation = useMutationAction(
    ({ userId, status, pwd }: { userId: string; status: string; pwd: string }) =>
      updateUserStatus(userId, status, pwd),
    {
      invalidateKeys: [queryKeys.admin.all],
      errorMessage: '修改状态失败',
      onSuccess: () => {
        setActionType(null);
        setPassword('');
        setErrorMsg('');
      },
      onError: (err: unknown) => setErrorMsg(err instanceof Error ? err.message : String(err)),
    },
  );

  const handleRoleSubmit = () => {
    if (!selectedUserId || !password) return;
    roleMutation.run({ userId: selectedUserId, role: selectedUserRole, pwd: password });
  };

  const handleStatusSubmit = () => {
    if (!selectedUserId || !password) return;
    statusMutation.run({ userId: selectedUserId, status: selectedUserStatus, pwd: password });
  };

  const openRoleDialog = (user: UsersListResponse['users'][number]) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.username);
    setSelectedUserRole(user.role === 'admin' ? 'user' : 'admin');
    setActionType('role');
    setErrorMsg('');
  };

  const openStatusDialog = (user: UsersListResponse['users'][number]) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.username);
    setSelectedUserStatus(user.status === 'active' ? 'suspended' : 'active');
    setActionType('status');
    setErrorMsg('');
  };

  const total = data?.total || 0;

  const roleOptions = [
    { key: 'user', label: platformUserRoleLabel('user') },
    { key: 'admin', label: platformUserRoleLabel('admin') },
  ];

  const statusOptions = [
    { key: 'active', label: '正常' },
    { key: 'suspended', label: '停用' },
    { key: 'deleted', label: '已注销' },
  ];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (key: string) => {
    setRoleFilter(key);
    setPage(1);
  };

  const handleStatusFilterChange = (key: string) => {
    setStatusFilter(key);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="filter-sticky">
        <FilterBar>
          <DropdownSelect
            options={roleOptions}
            value={roleFilter}
            onChange={handleRoleFilterChange}
            placeholder="全部角色"
          />
          <DropdownSelect
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            placeholder="全部状态"
          />
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="搜索用户名/邮箱..."
          />
        </FilterBar>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="data-table-wrapper">
            <TableRowsSkeleton columns={9} rows={10} />
          </div>
        ) : (data?.users || []).length === 0 ? (
          <EmptyState description="暂无用户" variant="compact" />
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '200px' }}>ID</th>
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
                        <span className={`tag ${isPlatformAdmin(user.role) ? 'tag--primary' : 'tag--default'}`}>
                          {platformUserRoleLabel(user.role)}
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
                        {formatDateTime(user.created_at)}
                      </td>
                      <td className="data-table__col--fixed">
                        <div className="action-buttons">
                          <Button variant="outline" size="sm" onClick={() => openRoleDialog(user)}>
                            {isPlatformAdmin(user.role) ? '降级' : '升级'}
                          </Button>
                          <Button
                            variant={user.status === 'active' ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => openStatusDialog(user)}
                          >
                            {user.status === 'active' ? '停用' : '启用'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </Card>

      <GlobalModal
        type="confirm"
        open={actionType === 'role'}
        title="修改用户角色"
        onClose={() => { setActionType(null); setPassword(''); setErrorMsg(''); }}
        onConfirm={handleRoleSubmit}
        loading={roleMutation.isPending}
        confirmText="确认修改"
      >
        <div>
          <p className="global-modal-dialog__message">
            确认将用户 {selectedUserName} 的角色改为 {platformUserRoleLabel(selectedUserRole)}？需要输入您的密码确认。
          </p>
          <div style={{ marginTop: '12px' }}>
            <Input
              type="password"
              showPasswordToggle
              name="admin-confirm-password"
              autoComplete="current-password"
              placeholder="输入您的管理员密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errorMsg}
            />
          </div>
        </div>
      </GlobalModal>

      <GlobalModal
        type="confirm"
        open={actionType === 'status'}
        title="修改用户状态"
        onClose={() => { setActionType(null); setPassword(''); setErrorMsg(''); }}
        onConfirm={handleStatusSubmit}
        loading={statusMutation.isPending}
        confirmText="确认修改"
      >
        <div>
          <p className="global-modal-dialog__message">
            确认将用户 {selectedUserName} 的状态改为 {selectedUserStatus === 'active' ? '正常' : '停用'}？需要输入您的密码确认。
          </p>
          <div style={{ marginTop: '12px' }}>
            <Input
              type="password"
              showPasswordToggle
              name="admin-confirm-password"
              autoComplete="current-password"
              placeholder="输入您的管理员密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errorMsg}
            />
          </div>
        </div>
      </GlobalModal>
    </AdminLayout>
  );
};

export default AdminUsers;
