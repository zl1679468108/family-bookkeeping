import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createBook, updateBook } from '../../services/booksApi';
import { BOOK_ICONS, getBookIconByKey } from '../../utils/bookIcons';
import { notify } from '../../utils/notifications';
import './index.scss';

interface BookCreateModalProps {
  open: boolean;
  onClose: () => void;
  editTarget?: { id: string; name: string; description?: string; icon?: string } | null;
  onSuccess?: () => void;
}

export const BookCreateModal: React.FC<BookCreateModalProps> = ({ open, onClose, editTarget, onSuccess }) => {
  const [bookName, setBookName] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookIconKey, setBookIconKey] = useState('default');

  const isEdit = Boolean(editTarget);

  useEffect(() => {
    if (open) {
      setBookName(editTarget?.name || '');
      setBookDesc(editTarget?.description || '');
      setBookIconKey(editTarget?.icon || 'default');
    }
  }, [open, editTarget]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: bookName.trim(),
        description: bookDesc.trim(),
        icon: bookIconKey,
      };
      return isEdit && editTarget ? updateBook({ ...payload, id: editTarget.id }) : createBook(payload);
    },
    onSuccess: () => {
      notify({ type: 'success', message: isEdit ? '更新成功' : '账本创建成功' });
      onClose();
      onSuccess?.();
    },
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) {
      notify({ type: 'error', message: '请输入名称' });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="book-modal-overlay" onClick={onClose}>
      <div className="book-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="book-modal-dialog__header">
          <h3 className="book-modal-dialog__title">{isEdit ? '编辑账本' : '创建账本'}</h3>
          <button className="book-modal-dialog__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="book-modal-dialog__body">
            {/* 账本名称 */}
            <div className="book-modal-field">
              <label className="book-modal-field__label">账本名称</label>
              <input
                type="text"
                className="book-modal-field__input"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="如：家庭账本"
                maxLength={50}
                autoFocus
              />
            </div>

            {/* 描述 */}
            <div className="book-modal-field">
              <label className="book-modal-field__label">描述（可选）</label>
              <input
                type="text"
                className="book-modal-field__input"
                value={bookDesc}
                onChange={(e) => setBookDesc(e.target.value)}
                placeholder="简单介绍一下这个账本"
                maxLength={200}
              />
            </div>

            {/* 图标选择 */}
            <div className="book-modal-field">
              <label className="book-modal-field__label">图标</label>
              <div className="book-modal-icon-grid">
                {BOOK_ICONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`book-modal-icon-btn ${bookIconKey === item.key ? 'is-active' : ''}`}
                    onClick={() => setBookIconKey(item.key)}
                  >
                    <span className="book-modal-icon-btn__icon">{getBookIconByKey(item.key)}</span>
                    <span className="book-modal-icon-btn__label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="book-modal-dialog__footer">
            <button type="button" className="book-modal-btn book-modal-btn--secondary" onClick={onClose}>取消</button>
            <button
              type="submit"
              className="book-modal-btn book-modal-btn--primary"
              disabled={mutation.isPending || !bookName.trim()}
            >
              {mutation.isPending ? '处理中...' : (isEdit ? '保存' : '创建账本')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookCreateModal;
