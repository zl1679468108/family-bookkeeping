import React from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getBookIconByKey } from '../../../utils/bookIcons';

interface BookGridProps {
  loading: boolean;
  books: any[];
  currentBook: any;
  onSelectBook: (book: any) => void;
  onCreateNew: () => void;
  onJoinByCode: () => void;
}

export const BookGrid: React.FC<BookGridProps> = ({
  loading,
  books,
  currentBook,
  onSelectBook,
  onCreateNew,
  onJoinByCode,
}) => {
  const getIconNode = (iconKey: string | undefined): React.ReactNode => getBookIconByKey(iconKey);

  if (loading) {
    return (
      <Card>
        <CardHeader title={<Skeleton width="80px" height="14px" />} />
        <div className="bk-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bk-card" style={{ pointerEvents: 'none' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Skeleton width="16px" height="16px" borderRadius="4px" />
                <Skeleton width="60%" height="13px" />
              </h4>
              <div className="bk-meta">
                <Skeleton width="50%" height="11px" />
              </div>
              <div className="bk-meta" style={{ marginTop: '3px' }}>
                <Skeleton width="30%" height="11px" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="我的账本"
        action={
          <div className="bk-header-actions">
            <Button variant="secondary" size="sm" onClick={onJoinByCode}>
              使用邀请码加入
            </Button>
            <Button variant="primary" size="sm" onClick={onCreateNew}>
              + 新建账本
            </Button>
          </div>
        }
      />
      <div className="bk-grid">
        {books.length === 0 && (
          <EmptyState
            icon="📖"
            title="还没有任何账本"
            description="创建你的第一个账本，或等待他人邀请你加入。"
          />
        )}
        {books.map((book: any) => {
          const isActive = currentBook?.id === book.id;
          return (
            <div
              key={book.id}
              className={`bk-card ${isActive ? ' active' : ''}`}
              onClick={() => onSelectBook(book)}
              style={{ cursor: 'pointer' }}
            >
              <div className="bk-header">
                <span className="bk-icon">{getIconNode(book.icon)}</span>
                <div className="bk-name">{book.name}</div>
              </div>
              <div className="bk-tags">
                <span className="bk-tag">{book.m || 1} 成员</span>
                <span className="bk-tag">{book.txn_count || 0} 笔交易</span>
              </div>
              {book.description && (
                <div className="bk-desc">{book.description}</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
