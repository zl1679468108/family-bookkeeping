import React, { useRef, useEffect } from 'react';
import { useBook } from '../../hooks/useBook';
import './BookSwitcher.scss';

export const BookSwitcher: React.FC = () => {
  const { currentBook, books, switchBook, loading } = useBook();
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
    return <div className="book-switcher book-switcher--loading"> </div>;
  }

  return (
    <div className="book-switcher" ref={ref}>
      <button
        className="book-switcher__trigger"
        onClick={() => setOpen(!open)}
      >
        <span className="book-switcher__icon">📖</span>
        <span className="book-switcher__name">
          {currentBook?.name || ' '}
        </span>
        <span className={`book-switcher__arrow ${open ? 'book-switcher__arrow--open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="book-switcher__menu">
          <div className="book-switcher__menu-label">切换账本</div>
          {books.map((book) => (
            <button
              key={book.id}
              className={`book-switcher__item ${currentBook?.id === book.id ? 'book-switcher__item--active' : ''}`}
              onClick={() => { switchBook(book); setOpen(false); }}
            >
              <span>📖</span> {book.name}
            </button>
          ))}
          <div className="book-switcher__menu-divider" />
          <a href="#/books" className="book-switcher__item book-switcher__item--manage" onClick={() => setOpen(false)}>
            ⚙️ 管理账本
          </a>
        </div>
      )}
    </div>
  );
};
