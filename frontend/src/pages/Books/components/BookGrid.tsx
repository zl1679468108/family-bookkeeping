import React from 'react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getBookIconByKey } from '../../../utils/bookIcons';
import { EMPTY_BOOKS } from '../../../utils/emptyCopy'
import { entityCreateButton, ENTITY_BOOK } from '../../../utils/entityCopy'
import { TITLE_JOIN_BY_INVITE, TITLE_MY_BOOKS } from '../../../utils/sectionCopy'
import { buildListCardClassName } from '../../../utils/listCard';

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
        <div className="card-header">
          <Skeleton width="60px" height="14px" borderRadius="var(--rs)" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="80px" height="24px" borderRadius="6px" />
            <Skeleton width="70px" height="24px" borderRadius="6px" />
          </div>
        </div>
        <div className="list-card-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="list-card" style={{ pointerEvents: 'none' }}>
              <div className="list-card__header">
                <Skeleton width="22px" height="22px" borderRadius="6px" />
                <Skeleton width="50%" height="14px" />
              </div>
              <div className="list-card__content">
                <Skeleton width="60px" height="18px" borderRadius="4px" />
                <Skeleton width="70px" height="18px" borderRadius="4px" />
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
        title={TITLE_MY_BOOKS}
        action={
          <div className="list-card-grid__header-actions">
            <Button variant="secondary" size="sm" onClick={onJoinByCode}>
              {TITLE_JOIN_BY_INVITE}
            </Button>
            <Button variant="primary" size="sm" onClick={onCreateNew}>
              {entityCreateButton(ENTITY_BOOK)}
            </Button>
          </div>
        }
      />
      {books.length === 0 ? (
        <EmptyState
          description={EMPTY_BOOKS}
        />
      ) : (
        <div className="list-card-grid">
          {books.map((book: any) => {
            const isActive = currentBook?.id === book.id;
            return (
              <div
                key={book.id}
                className={buildListCardClassName({ active: isActive })}
                onClick={() => onSelectBook(book)}
                style={{ cursor: 'pointer' }}
              >
                <div className="list-card__header">
                  <span className="list-card__icon">{getIconNode(book.icon)}</span>
                  <span className="list-card__title">{book.name}</span>
                </div>
                <div className="list-card__content">
                  <span className="list-card__badge">{book.member_count || 1} 成员</span>
                  <span className="list-card__badge">{book.txn_count || 0} 笔交易</span>
                </div>
                {book.description && (
                  <div className="list-card__desc">{book.description}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
