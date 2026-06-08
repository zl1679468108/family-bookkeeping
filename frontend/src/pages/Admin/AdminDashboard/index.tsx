import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import { getAdminStats, PlatformStats } from '../../../services/adminApi';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery<PlatformStats>({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
          加载中...
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '60px', color: '#e74c3c' }}>
          加载失败，请重试
        </div>
      </AdminLayout>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    flex: 1,
    minWidth: '200px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: '8px 0',
  };

  return (
    <AdminLayout>
      <h2 style={{ margin: '0 0 24px', fontSize: '22px', color: '#1a1a1a' }}>
        📊 平台数据看板
      </h2>

      {/* 核心指标卡片 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>总用户数</div>
          <div style={valueStyle}>{stats?.totalUsers}</div>
          <div style={{ fontSize: '12px', color: '#07C160' }}>
            今日新增 {stats?.newUsersToday}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>活跃用户</div>
          <div style={valueStyle}>{stats?.activeUsers}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            管理员 {stats?.adminUsers} 人
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>总账本数</div>
          <div style={valueStyle}>{stats?.totalBooks}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>总交易数</div>
          <div style={valueStyle}>{stats?.totalTransactions}</div>
        </div>
      </div>

      {/* 本月收支概览 */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>本月收入</div>
          <div style={{ ...valueStyle, color: '#07C160' }}>
            +{stats?.monthIncome.toFixed(2)}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>本月支出</div>
          <div style={{ ...valueStyle, color: '#e74c3c' }}>
            -{stats?.monthExpense.toFixed(2)}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#888' }}>本月结余</div>
          <div
            style={{
              ...valueStyle,
              color: (stats?.monthNet || 0) >= 0 ? '#07C160' : '#e74c3c',
            }}
          >
            {(stats?.monthNet || 0) >= 0 ? '+' : ''}
            {stats?.monthNet.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 最近注册用户 */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#1a1a1a' }}>
          最近注册用户
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: '#888' }}>
                用户名
              </th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: '#888' }}>
                Email
              </th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: '#888' }}>
                角色
              </th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: '#888' }}>
                状态
              </th>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '13px', color: '#888' }}>
                注册时间
              </th>
            </tr>
          </thead>
          <tbody>
            {(stats?.recentUsers || []).map((user) => (
              <tr
                key={user.id}
                style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <td style={{ padding: '12px', fontSize: '14px' }}>{user.username}</td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{user.email}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  <span
                    style={{
                      background: user.role === 'admin' ? '#07C160' : '#f0f0f0',
                      color: user.role === 'admin' ? '#fff' : '#666',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  <span
                    style={{
                      color: user.status === 'active' ? '#07C160' : '#e74c3c',
                      fontSize: '12px',
                    }}
                  >
                    {user.status === 'active' ? '正常' : user.status === 'suspended' ? '停用' : '已注销'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px', color: '#999' }}>
                  {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
