import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutationAction } from '../../../hooks/useMutationAction';
import { createBook, updateBook } from '../../../services/booksApi';
import { fetchCustomIcons, uploadIcon, deleteIcon } from '../../../services/iconsApi';
import { BOOK_ICONS, getBookIconByKey } from '../../../utils/bookIcons';

import { notifyInfo, notifySuccess } from '../../../utils/notifyError';
import { GlobalModal } from '../../../components/ui';
import { Button } from '../../../components/ui/Button';
import { FooterActions } from '../../../components/ui/FooterActions';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { IconGrid } from '../../../components/ui/IconGrid';
import type { CustomIconItem } from '../../../components/ui/IconGrid';
import './index.scss';
import { queryKeys } from '../../../utils/queryKeys'
import { STALE } from '../../../utils/cachePolicy'

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

  // 获取账本自定义图标
  const { data: customIcons = [], refetch: refetchIcons } = useQuery({
    queryKey: queryKeys.customIcons.byType('book'),
    queryFn: () => fetchCustomIcons('book'),
    staleTime: STALE.customIcons,
    enabled: open, // 仅弹窗打开时请求
  });

  const mutation = useMutationAction(
    () => {
      const isCustomIcon = bookIconKey.length === 36 && bookIconKey.includes('-');
      const payload = {
        name: bookName.trim(),
        description: bookDesc.trim(),
        ...(isCustomIcon ? { icon_id: bookIconKey } : { icon: bookIconKey }),
      };
      return isEdit && editTarget ? updateBook({ ...payload, id: editTarget.id }) : createBook(payload);
    },
    {
      successMessage: isEdit ? '更新成功' : '账本创建成功',
      errorMessage: isEdit ? '更新失败' : '创建失败',
      onSuccess: () => {
        onClose();
        onSuccess?.();
      },
    },
  );

  const handleSubmit = () => {
    if (!bookName.trim()) {
      notifyInfo('请输入名称');
      return;
    }
    mutation.run();
  };

  const iconOptions = BOOK_ICONS.map((item) => ({
    value: item.key,
    icon: getBookIconByKey(item.key),
    label: item.label,
  }));

  // 自定义图标列表
  const customIconItems: CustomIconItem[] = (customIcons || []).map((ci) => ({
    id: ci.id,
    icon_url: ci.icon_url,
    icon_type: ci.icon_type,
  }));

  // 上传图标处理
  const handleIconUpload = useCallback(async (file: File, iconType: 'category' | 'book' | 'avatar') => {
    await uploadIcon(file, iconType);
    refetchIcons();
    notifySuccess('图标上传成功');
  }, [refetchIcons]);

  // 删除图标处理
  const handleIconDelete = useCallback(async (iconId: string) => {
    await deleteIcon(iconId);
    refetchIcons();
    notifySuccess('图标已删除');
  }, [refetchIcons]);

  return (
    <GlobalModal
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑账本' : '创建账本'}
      width={520}
      footer={
        <FooterActions align="end" className="global-modal-dialog__footer-inner">
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={mutation.isPending || !bookName.trim()}
            >
              {mutation.isPending ? '处理中...' : (isEdit ? '保存' : '创建账本')}
            </Button>
          </FooterActions>
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
          required
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
          <IconGrid
            options={iconOptions}
            value={bookIconKey}
            onChange={setBookIconKey}
            customIcons={customIconItems}
            onUpload={handleIconUpload}
            onDelete={handleIconDelete}
            iconType="book"
            columns={5}
          />
        </div>
      </div>
    </GlobalModal>
  );
};

export default BookCreateModal;
