/**
 * AddTransaction page — Create / Edit transaction with edit mode support.
 * Reads ?edit=id for editing, ?type=&category= for pre-fill.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCategories } from '../hooks/useCategories';
import { useCreateTransaction, useUpdateTransaction } from '../hooks/useTransactions';
import { getTransaction } from '../services/transactionsApi';
import CategoryGrid from '../components/CategoryGrid';
import NumberPad from '../components/NumberPad';
import DatePicker from '../components/DatePicker';
import LocationPicker from '../components/LocationPicker';
import type { Category, LocationInfo } from '../types';
import { ApiError } from '../services/api';

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEdit = !!editId;
  const urlType = searchParams.get('type') as 'expense' | 'income' | null;
  const urlCategory = searchParams.get('category') || '';

  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();

  const [type, setType] = useState<'expense' | 'income'>(
    (urlType === 'expense' || urlType === 'income') ? urlType : 'expense'
  );
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: categories = [] } = useCategories(type);
  const filteredCategories = useMemo(() => [...categories].sort((a, b) => a.sort_order - b.sort_order), [categories]);

  // Load existing transaction for edit mode
  const { data: editData } = useQuery({
    queryKey: ['transaction', editId],
    queryFn: () => getTransaction(Number(editId)),
    enabled: isEdit,
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setAmount(String(editData.amount));
      setDate(new Date(editData.date));
      setNote(editData.description || '');
      const locData = editData as any;
      if (locData.latitude && locData.longitude) {
        setLocation({ name: locData.location_name || '', address: '', lat: locData.latitude, lng: locData.longitude });
      }
    }
  }, [editData]);

  // Set category from edit data or URL param once categories load
  useEffect(() => {
    if (editData && categories.length > 0) {
      const cat = categories.find((c) => c.id === (editData.category_id || editData.category));
      if (cat) setSelectedCategory(cat);
    } else if (!isEdit && urlCategory && categories.length > 0) {
      const cat = categories.find((c) => c.id === urlCategory);
      if (cat) setSelectedCategory(cat);
    }
  }, [editData, categories, urlCategory, isEdit]);

  // Auto-select first category if none
  useEffect(() => {
    if (!selectedCategory && filteredCategories.length > 0 && !isEdit) {
      setSelectedCategory(filteredCategories[0]);
    }
  }, [filteredCategories, selectedCategory]);

  const handleNumInput = useCallback((char: string) => {
    setAmount((prev) => {
      if (char === '.' && prev.includes('.')) return prev;
      if (char === '.' && prev === '') return '0.';
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      if (prev.replace('.', '').length >= 9) return prev;
      return prev + char;
    });
  }, []);
  const handleDelete = useCallback(() => setAmount((prev) => prev.slice(0, -1)), []);

  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) { setError('请输入有效金额'); return; }
    if (!selectedCategory) { setError('请选择分类'); return; }
    setError('');
    setSubmitting(true);
    const payload = {
      amount: numAmount,
      category: selectedCategory.id,
      type,
      date: date.toISOString(),
      description: note || undefined,
      location_name: location?.name,
      location_lat: location?.lat,
      location_lng: location?.lng,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: Number(editId), input: payload });
      } else {
        await createMut.mutateAsync(payload);
      }
      navigate(isEdit ? '/transactions' : '/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }, [amount, selectedCategory, type, date, note, location, isEdit, editId, createMut, updateMut, navigate]);

  const formatDate = (d: Date) => {
    const t = new Date();
    const y = new Date(t); y.setDate(y.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return '今天';
    if (d.toDateString() === y.toDateString()) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="touch-target text-text-secondary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 className="text-base font-semibold">{isEdit ? '编辑交易' : '记一笔'}</h1>
        <div className="w-11" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-center py-4">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setType('expense')}
              className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'expense' ? 'bg-danger text-white shadow-sm' : 'text-text-secondary'}`}>支出</button>
            <button onClick={() => setType('income')}
              className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'income' ? 'bg-success text-white shadow-sm' : 'text-text-secondary'}`}>收入</button>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-4xl font-bold text-text">¥{amount || '0'}</p>
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
        </div>

        <div className="px-4 mb-4">
          <p className="text-xs text-text-secondary mb-3">选择分类</p>
          <CategoryGrid categories={filteredCategories} selectedId={selectedCategory?.id || null} onSelect={(c) => { setSelectedCategory(c); setError(''); }} />
        </div>

        <div className="px-4 space-y-3">
          <button onClick={() => setShowDatePicker(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm">
            <span className="text-text-secondary">日期</span><span className="font-medium">{formatDate(date)}</span>
          </button>
          <div className="px-4 py-3 rounded-xl bg-white border border-gray-100">
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加备注..." className="w-full text-sm outline-none bg-transparent" maxLength={100} />
          </div>
          <button onClick={() => setShowLocationPicker(true)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-gray-100 text-sm">
            <span className="text-text-secondary">{location ? location.name : '添加位置'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-100 px-3 py-3 safe-bottom">
        <NumberPad onInput={handleNumInput} onDelete={handleDelete} onConfirm={handleSubmit} confirmDisabled={submitting || !amount} />
      </div>

      {showDatePicker && <DatePicker value={date} onChange={setDate} onClose={() => setShowDatePicker(false)} />}
      <LocationPicker visible={showLocationPicker} onConfirm={(loc) => { setLocation(loc); setShowLocationPicker(false); }} onSkip={() => setShowLocationPicker(false)} />
    </div>
  );
};

export default AddTransaction;
