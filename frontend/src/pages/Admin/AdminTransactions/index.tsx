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
import { FilterBar } from '../../../components/ui/FilterBar'
import { SearchInput } from '../../../components/ui/Input'
import { DropdownSelect } from '../../../components/ui/Dropdown'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Pagination } from '../../../components/ui/Pagination'
import { EmptyState } from '../../../components/ui/EmptyState'
import { TableRowsSkeleton } from '../../../components/ui/Skeleton'
import { GlobalModal } from '../../../components/ui';
import { renderCategoryIcon } from '../../../utils/renderCategoryIcon';

const AdminTransactions: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [typeFilter, setTypeFilter] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [pageSize, setPageSize] = useState(20);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const { data: usersData } = useQuery<UsersListResponse>({
    queryKey: ['admin', 'users-for-select'],
    queryFn: () => getAdminUsers({ page: 1, pageSize: 1000 }),
  });

  const usersForSelect = usersData?.users || [];

  const { data: booksData } = useQuery<AdminBookListResponse>({
    queryKey: ['admin', 'books-for-select'],
    queryFn: () => getAdminBooks(),
  });

  const booksForSelect = booksData?.books || [];

  const { data, isLoading, error } = useQuery<AdminTransactionsResponse>({
    queryKey: ['admin', 'transactions', page, debouncedSearch, typeFilter, bookFilter, userFilter, pageSize],
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

  const total = data?.total || 0;

  const bookOptions = booksForSelect.map((b) => ({ key: b.id, label: b.name }));
  const userOptions = usersForSelect.map((u) => ({ key: u.id, label: u.username }));
  const typeOptions = [
    { key: 'income', label: '收入' },
    { key: 'expense', label: '支出' },
  ];

  const handleBookChange = (key: string) => {
    setBookFilter(key);
    setPage(1);
  };

  const handleUserChange = (key: string) => {
    setUserFilter(key);
    setPage(1);
  };

  const handleTypeChange = (key: string) => {
    setTypeFilter(key);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="filter-sticky">
        <FilterBar>
          <DropdownSelect
            options={bookOptions}
            value={bookFilter}
            onChange={handleBookChange}
            placeholder="全部账本"
          />
          <DropdownSelect
            options={userOptions}
            value={userFilter}
            onChange={handleUserChange}
            placeholder="全部用户"
          />
          <DropdownSelect
            options={typeOptions}
            value={typeFilter}
            onChange={handleTypeChange}
            placeholder="全部类型"
          />
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="搜索交易描述..."
          />
        </FilterBar>
      </div>

      <Card padding="none" className="data-table-panel data-table-panel--admin">
        {isLoading ? (
          <div className="data-table-wrapper">
            <TableRowsSkeleton columns={9} rows={10} />
          </div>
        ) : error ? (
          <EmptyState title="加载失败" description="请稍后重试" variant="compact" />
        ) : (data?.transactions || []).length === 0 ? (
          <EmptyState title="暂无交易记录" variant="compact" />
        ) : (
          <>
            <div className="data-table-panel__scroll">
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
                            <span className="category-icon">{renderCategoryIcon(t.categories.icon, { size: 16 })}</span>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPreview(t.image_urls!)}
                            >
                              查看图片 ({t.image_urls.length})
                            </Button>
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

            <div className="data-table-panel__footer">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        )}
      </Card>

      <GlobalModal
        type="detail"
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={`图片预览（${previewImages.length}张）`}
      >
        <div className="detail-image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {previewImages.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleViewImage(url);
              }}
              className="detail-image-item"
              style={{ cursor: 'pointer', display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--line)', aspectRatio: '1 / 1', backgroundColor: 'var(--bg)', padding: 0 }}
              title="点击在新窗口打开"
            >
              <img src={url} alt={`图片 ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      </GlobalModal>
    </AdminLayout>
  );
};

export default AdminTransactions;
