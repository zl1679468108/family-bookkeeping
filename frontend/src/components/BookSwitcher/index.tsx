import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBook } from '../../hooks/useBook';
import { Skeleton } from '../ui/Skeleton';
import './BookSwitcher.scss';

export const BookSwitcher: React.FC = () => {
  const { currentBook, books, switchBook, loading, hasBooks } = useBook();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading) {
    return <Skeleton width="100%" height="36px" borderRadius="8px" />;
  }

  // 用户还没有任何账本 → 点击触发器直接跳转到账本管理页面
  if (!hasBooks) {
    return (
      <div className="book-switcher" ref={ref}>
        <button
          type="button"
          className="book-switcher__trigger book-switcher__trigger--empty"
          onClick={() => navigate('/books')}
          title="创建或加入账本"
        >
          <span className="book-switcher__avatar">📖</span>
          <span className="book-switcher__name">暂无账本 · 点击创建</span>
          <svg className="book-switcher__chevron" width="10" height="10" viewBox="0 0 12 12">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    );
  }

  const bookAvatarChar = currentBook?.name?.charAt(0) || '📖';

  return (
    <div className="book-switcher" ref={ref}>
      <button
        type="button"
        className="book-switcher__trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="book-switcher__avatar">{bookAvatarChar}</span>
        <span className="book-switcher__name">
          {currentBook?.name || '选择账本'}
        </span>
        <svg className={`book-switcher__chevron ${open ? 'book-switcher__chevron--open' : ''}`} width="10" height="10" viewBox="0 0 12 12">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="book-switcher__menu">
          <div className="book-switcher__menu-label">切换账本</div>
          {books.map((book: import('../../hooks/useBook').Book) => (
            <button
              key={book.id}
              className={`book-switcher__item ${currentBook?.id === book.id ? 'book-switcher__item--active' : ''}`}
              onClick={() => { switchBook(book); setOpen(false); }}
            >
              <span className="book-switcher__item-avatar">{book.name?.charAt(0) || '📖'}</span>
              <span>{book.name}</span>
            </button>
          ))}
          <div className="book-switcher__menu-divider" />
          <a href="#/books" className="book-switcher__item book-switcher__item--manage" onClick={() => setOpen(false)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            管理账本
          </a>
        </div>
      )}
    </div>
  );
};
