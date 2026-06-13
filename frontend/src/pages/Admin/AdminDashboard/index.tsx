import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import { getAdminStats, PlatformStats } from '../../../services/adminApi';
import { StatCardsSkeleton, TableRowsSkeleton } from '../../../components/ui/Skeleton';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery<PlatformStats>({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  });

  if (error) {
    return (
      <AdminLayout>
        <div className="empty-state empty-state--error">加载失败，请重试</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* 核心指标卡片 */}
      {isLoading ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__label">总用户数</div>
            <div className="stat-card__value">{stats?.totalUsers}</div>
            <div className="stat-card__hint stat-card__hint--success">今日新增 {stats?.newUsersToday}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">30天活跃</div>
            <div className="stat-card__value">{stats?.activeUsers}</div>
            <div className="stat-card__hint">管理员 {stats?.adminUsers} 人</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">总账本数</div>
            <div className="stat-card__value">{stats?.totalBooks}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">总交易数</div>
            <div className="stat-card__value">{stats?.totalTransactions}</div>
          </div>
        </div>
      )}

      {/* 本月收支概览 */}
      {isLoading ? (
        <StatCardsSkeleton count={3} />
      ) : (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-card__label">本月收入</div>
            <div className="stat-card__value stat-card__value--success">
              +{stats?.monthIncome.toFixed(2)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">本月支出</div>
            <div className="stat-card__value stat-card__value--danger">
              -{stats?.monthExpense.toFixed(2)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">本月结余</div>
            <div
              className={`stat-card__value ${(stats?.monthNet || 0) >= 0 ? 'stat-card__value--success' : 'stat-card__value--danger'}`}>
              {(stats?.monthNet || 0) >= 0 ? '+' : ''}
              {stats?.monthNet.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* 最近注册用户 */}
      <div className="card">
        <div className="card__header">
          <div className="card__title">最近注册用户</div>
        </div>
        <div className="card__body">
          {isLoading ? (
            <TableRowsSkeleton columns={5} rows={5} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>Email</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentUsers || []).map((user) => (
                  <tr key={user.id} onClick={() => navigate(`/admin/users/${user.id}`)}>
                    <td className="data-table__cell--primary">{user.username}</td>
                    <td className="data-table__cell--muted">{user.email}</td>
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
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
