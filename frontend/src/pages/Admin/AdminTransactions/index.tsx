import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../AdminLayout';
import {
  getAdminTransactions,
  AdminTransactionsResponse,
  getAdminUsers,
  UsersListResponse,
  getAdminBooks,
  AdminBookListResponse,
} from '../../../services/adminApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableRowsSkeleton } from '../../../components/ui/Skeleton';
import { DetailModal } from '../../../components/DetailModal';

const AdminTransactions: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const pageSize = 20;

  // 图片预览弹窗状态
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // 获取所有用户（用于筛选下拉）
  const { data: usersData } = useQuery<UsersListResponse>({
    queryKey: ['admin', 'users-for-select'],
    queryFn: () => getAdminUsers({ page: 1, pageSize: 1000 }),
  });

  const usersForSelect = usersData?.users || [];

  // 获取所有账本（用于筛选下拉）
  const { data: booksData } = useQuery<AdminBookListResponse>({
    queryKey: ['admin', 'books-for-select'],
    queryFn: () => getAdminBooks(),
  });

  const booksForSelect = booksData?.books || [];

  const { data, isLoading, error } = useQuery<AdminTransactionsResponse>({
    queryKey: ['admin', 'transactions', page, debouncedSearch, typeFilter, bookFilter, userFilter],
    queryFn: () =>
      getAdminTransactions({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        book_id: bookFilter || undefined,
        user_id: userFilter || undefined,
      }),
  });

  const handleOpenPreview = (urls: string[]) => {
    if (!urls || urls.length === 0) return;
    setPreviewImages(urls);
    setShowPreview(true);
  };

  const handleViewImage = (url: string) => {
    window.open(url, '_blank');
  };

  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  return (
    <AdminLayout>
      <div className="filter-sticky">
        <div className="filter-bar">
          <select
            className="form-input form-input--select"
            value={bookFilter}
            onChange={(e) => { setBookFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部账本</option>
            {booksForSelect.map((book) => (
              <option key={book.id} value={book.id}>{book.name}</option>
            ))}
          </select>

          <select
            className="form-input form-input--select"
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部用户</option>
            {usersForSelect.map((user) => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>

          <select
            className="form-input form-input--select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">全部类型</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>

          <input
            type="text"
            className="form-input filter-bar__input"
            placeholder="搜索交易描述..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card card--scrollable">
        {isLoading ? (
          <div className="data-table-wrapper">
            <TableRowsSkeleton columns={9} rows={10} />
          </div>
        ) : error ? (
          <div className="empty-state empty-state--error">加载失败，请重试</div>
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th style={{ width: '150px' }}>用户</th>
                    <th style={{ width: '80px' }}>类型</th>
                    <th style={{ width: '100px' }}>分类</th>
                    <th style={{ width: '120px' }}>金额</th>
                    <th style={{ width: '150px' }}>账本</th>
                    <th style={{ width: '150px' }}>日期</th>
                    <th>描述</th>
                    <th className="data-table__col--fixed" style={{ width: '180px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.transactions || []).map((t) => (
                    <tr key={t.id}>
                      <td className="data-table__cell--muted">{t.id}</td>
                      <td>
                        <div className="data-table__cell--primary">{t.users?.username || '未知'}</div>
                        <div className="data-table__sub">{t.users?.email || ''}</div>
                      </td>
                      <td>
                        <span
                          className={
                            t.type === 'income' ? 'status status--success' : 'status status--danger'
                          }
                        >
                          {t.type === 'income' ? '收入' : '支出'}
                        </span>
                      </td>
                      <td>
                        {t.categories ? (
                          <span className="category-cell">
                            <span className="category-icon">{t.categories.icon}</span>
                            <span>{t.categories.name}</span>
                          </span>
                        ) : (
                          <span className="status status--muted">-</span>
                        )}
                      </td>
                      <td className="data-table__col--right">
                        <span
                          className={`amount ${t.type === 'income' ? 'amount--income' : 'amount--expense'}`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {Number(t.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="data-table__cell--muted">{t.books?.name || '-'}</td>
                      <td className="data-table__cell--muted">
                        {new Date(t.date).toLocaleDateString('zh-CN')}
                      </td>
                      <td>{t.description || '-'}</td>
                      <td className="data-table__col--fixed">
                        <div className="action-buttons" style={{ gap: '4px', flexWrap: 'wrap' }}>
                          {t.image_urls && t.image_urls.length > 0 ? (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenPreview(t.image_urls!)}
                            >
                              查看图片 ({t.image_urls.length})
                            </button>
                          ) : (
                            <span className="status status--muted">无</span>
                          )}
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

      {/* 图片预览弹窗 */}
      <DetailModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        title={`图片预览（${previewImages.length}张）`}
      >
        <div className="detail-image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {previewImages.map((url, idx) => (
            <a
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                handleViewImage(url);
              }}
              className="detail-image-item"
              style={{ cursor: 'pointer', display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '1 / 1', backgroundColor: 'var(--bg)' }}
              title="点击在新窗口打开"
            >
              <img src={url} alt={`图片 ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </a>
          ))}
        </div>
      </DetailModal>
    </AdminLayout>
  );
};

export default AdminTransactions;
