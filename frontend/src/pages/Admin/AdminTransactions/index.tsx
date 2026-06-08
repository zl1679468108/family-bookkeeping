import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../AdminLayout';
import { getAdminTransactions, AdminTransactionsResponse } from '../../../services/adminApi';

const AdminTransactions: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const pageSize = 20;

  const { data, isLoading, error } = useQuery<AdminTransactionsResponse>({
    queryKey: ['admin', 'transactions', page, search, typeFilter],
    queryFn: () =>
      getAdminTransactions({
        page,
        pageSize,
        search: search || undefined,
        type: (typeFilter as 'income' | 'expense') || undefined,
      }),
  });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', color: '#1a1a1a' }}>💰 交易监控</h2>
        <div style={{ fontSize: '13px', color: '#888' }}>
          共 {data?.total || 0} 笔交易
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
          placeholder="搜索交易描述..."
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
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="">全部类型</option>
          <option value="income">收入</option>
          <option value="expense">支出</option>
        </select>
      </div>

      {/* 交易列表 */}
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
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#e74c3c' }}>加载失败，请重试</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>用户</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>类型</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>分类</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '13px', color: '#888' }}>金额</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>账本</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>日期</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '13px', color: '#888' }}>描述</th>
              </tr>
            </thead>
            <tbody>
              {(data?.transactions || []).map((t: AdminTransactionsResponse['transactions'][number]) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <div style={{ fontWeight: 500 }}>{t.users?.username || '未知'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{t.users?.email || ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span
                      style={{
                        color: t.type === 'income' ? '#07C160' : '#e74c3c',
                        fontWeight: 500,
                      }}
                    >
                      {t.type === 'income' ? '收入' : '支出'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {t.categories ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{t.categories.icon}</span>
                        <span>{t.categories.name}</span>
                      </span>
                    ) : (
                      <span style={{ color: '#ccc' }}>-</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: t.type === 'income' ? '#07C160' : '#e74c3c',
                    }}
                  >
                    {t.type === 'income' ? '+' : '-'}{Number(t.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {t.books?.name || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#666' }}>
                    {new Date(t.date).toLocaleDateString('zh-CN')}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#333',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.description || '-'}
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
    </AdminLayout>
  );
};

export default AdminTransactions;
