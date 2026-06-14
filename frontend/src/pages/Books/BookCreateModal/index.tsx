import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createBook, updateBook } from '../../../services/booksApi';
import { BOOK_ICONS, getBookIconByKey } from '../../../utils/bookIcons';
import { notify } from '../../../utils/notifications';
import { Modal, ModalFooter } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { IconGrid } from '../../../components/ui/IconGrid';
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

  const handleSubmit = () => {
    if (!bookName.trim()) {
      notify({ type: 'error', message: '请输入名称' });
      return;
    }
    mutation.mutate();
  };

  const iconOptions = BOOK_ICONS.map((item) => ({
    value: item.key,
    icon: getBookIconByKey(item.key),
    label: item.label,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑账本' : '创建账本'}
      width={520}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmText={mutation.isPending ? '处理中...' : (isEdit ? '保存' : '创建账本')}
          confirmLoading={mutation.isPending}
          confirmDisabled={!bookName.trim()}
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input
          label="账本名称"
          type="text"
          value={bookName}
          onChange={(e) => setBookName(e.target.value)}
          placeholder="如：家庭账本"
          maxLength={50}
          autoFocus
        />

        <Textarea
          label="描述（可选）"
          value={bookDesc}
          onChange={(e) => setBookDesc(e.target.value)}
          placeholder="简单介绍一下这个账本"
          maxLength={200}
          rows={3}
        />

        <div>
          <label className="ui-input-label" style={{ display: 'block', marginBottom: '6px' }}>图标</label>
          <IconGrid options={iconOptions} value={bookIconKey} onChange={setBookIconKey} columns={5} />
        </div>
      </div>
    </Modal>
  );
};

export default BookCreateModal;
