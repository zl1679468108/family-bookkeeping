/**
 * CategoriesPage — Manage income/expense categories (分类管理).
 * Features: tab switch, modal add/edit, delete confirm, emoji presets.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/categoriesApi';
import EmptyState from '../components/EmptyState';
import type { Category } from '../types';

const EMOJI_PRESETS = [
  '🍜', '🚗', '🛍', '🎮', '🏠', '💊', '📚', '🎬',
  '✈️', '💻', '👶', '🐱', '🎁', '☕', '💡', '📱',
  '🎵', '🏋️', '💄', '🎂', '🛒', '🚇', '🐶', '🌿',
];

interface ModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  type: 'expense' | 'income';
  initialName: string;
  initialIcon: string;
  onConfirm: (name: string, icon: string) => void;
  onClose: () => void;
}

const CategoryModal: React.FC<ModalProps> = ({ open, mode, type, initialName, initialIcon, onConfirm, onClose }) => {
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon);

  useEffect(() => {
    if (open) { setName(initialName); setIcon(initialIcon); }
  }, [open, initialName, initialIcon]);

  if (!open) return null;

  const label = type === 'expense' ? '支出' : '收入';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-4">
          {mode === 'add' ? `新增${label}分类` : `编辑${label}分类`}
        </h2>

        <div className="mb-4">
          <label className="block text-xs text-text-secondary mb-1.5">名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入分类名称"
            maxLength={10}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <p className="text-xs text-text-secondary mt-1">{name.length}/10</p>
        </div>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary mb-1.5">图标</label>
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_PRESETS.map((e) => (
              <button
                key={e}
                onClick={() => setIcon(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center ${icon === e ? 'bg-primary-bg ring-1 ring-primary' : 'bg-gray-50'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm">取消</button>
          <button onClick={() => name.trim() && onConfirm(name.trim(), icon)} disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm disabled:opacity-50">确认</button>
        </div>
      </div>
    </div>
  );
};

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: allCats = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: 60_000,
  });

  const filtered = allCats.filter((c) => c.type === tab);

  const createMut = useMutation({
    mutationFn: (dto: { name: string; icon: string; type: string }) => createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name, icon }: { id: string; name: string; icon: string }) => updateCategory(id, { name, icon }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
      setEditCat(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
    },
  });

  const handleModalConfirm = useCallback((name: string, icon: string) => {
    if (modalMode === 'add') {
      createMut.mutate({ name, icon, type: tab });
    } else if (editCat) {
      updateMut.mutate({ id: editCat.id, name, icon });
    }
  }, [modalMode, editCat, tab, createMut, updateMut]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="touch-target text-text-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-base font-semibold">分类管理</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex">
        <button onClick={() => setTab('expense')}
          className={`flex-1 py-2.5 text-sm font-medium border-b-2 ${tab === 'expense' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}>支出分类</button>
        <button onClick={() => setTab('income')}
          className={`flex-1 py-2.5 text-sm font-medium border-b-2 ${tab === 'income' ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}>收入分类</button>
      </div>

      <div className="px-4 pt-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {filtered.map((cat) => {
                const isDefault = cat.is_default === true;
                return (
                  <div key={cat.id} className="bg-white rounded-xl shadow-sm p-3 text-center relative" style={{ width: 'calc(25% - 9px)' }}>
                    {isDefault && (
                      <span className="absolute top-1 right-1 text-[10px] bg-gray-100 px-1 rounded text-text-secondary">默认</span>
                    )}
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <p className="text-xs truncate text-text mb-2">{cat.name}</p>
                    {!isDefault && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setModalMode('edit'); setEditCat(cat); setModalOpen(true); }}
                          className="w-6 h-6 flex items-center justify-center rounded text-text-secondary active:bg-gray-50">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteTarget(cat)}
                          className="w-6 h-6 flex items-center justify-center rounded text-text-secondary active:bg-red-50 active:text-[#D85A30]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => { setModalMode('add'); setEditCat(null); setModalOpen(true); }}
              className="mt-4 w-full py-3 rounded-xl border border-dashed border-gray-300 text-sm text-text-secondary active:bg-gray-50"
            >
              + 添加分类
            </button>
          </>
        )}
      </div>

      {/* Modal */}
      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        type={tab}
        initialName={editCat?.name || ''}
        initialIcon={editCat?.icon || '📌'}
        onConfirm={handleModalConfirm}
        onClose={() => { setModalOpen(false); setEditCat(null); }}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl mx-8 p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-text-secondary mb-5">确定删除自定义分类「{deleteTarget.name}」吗？删除后不可恢复。</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm">取消</button>
              <button onClick={() => deleteMut.mutate(deleteTarget.id)} disabled={deleteMut.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#D85A30] text-white text-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
