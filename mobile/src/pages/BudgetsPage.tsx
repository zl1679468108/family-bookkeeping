/**
 * BudgetsPage — Manage monthly category budgets (预算管理).
 * Features aligned with PC version: expense budgets + income categories list.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBudgets, fetchBudgetStatus, upsertBudgets, copyBudgets } from '../services/budgetsApi';
import { fetchCategories } from '../services/categoriesApi';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import type { BudgetRecord, Category } from '../types';

interface BudgetItem {
  category_id: string;
  name: string;
  icon: string;
  amount: number;
  spent: number;
  progress: number;
  status: string;
}

const getCurrentMonthStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: 60_000,
  });

  const expenseCats = categories.filter((c) => c.type === 'expense');
  const incomeCats = categories.filter((c) => c.type === 'income');

  const { data: budgets = [], isLoading } = useQuery<BudgetRecord[]>({
    queryKey: ['budgets', monthKey],
    queryFn: () => fetchBudgets(monthKey),
    staleTime: 60_000,
  });

  const { data: budgetStatus } = useQuery({
    queryKey: ['budgets', 'status', monthKey],
    queryFn: () => fetchBudgetStatus(monthKey),
    staleTime: 60_000,
  });

  // Build budget map: category_id → amount
  const budgetMap = new Map<string, number>();
  budgets.forEach((b) => {
    const catId = (b as any).category_id || (b as any).category;
    if (catId) budgetMap.set(catId, b.amount);
  });

  // Build status map: category_id → { spent, progress, status }
  const statusMap = new Map<string, { spent: number; progress: number; status: string }>();
  const statusItems: any[] = (budgetStatus as any)?.categories || (budgetStatus as any)?.items || [];
  statusItems.forEach((c: any) => {
    const catId = c.category_id || c.category;
    if (catId) {
      statusMap.set(catId, {
        spent: c.spent || 0,
        progress: c.progress || 0,
        status: c.status || 'safe',
      });
    }
  });

  // Local edit state
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const lastSynced = useRef('');

  // Sync budgets → editValues (critical: use useEffect, not useMemo)
  useEffect(() => {
    if (expenseCats.length === 0) return;
    const synced: Record<string, number> = {};
    expenseCats.forEach((cat) => {
      synced[cat.id] = budgetMap.get(cat.id) || 0;
    });
    const hash = JSON.stringify(synced);
    if (hash !== lastSynced.current) {
      lastSynced.current = hash;
      setEditValues(synced);
    }
  }, [monthKey, budgets, expenseCats.length]);

  const handleAmountChange = (catId: string, value: string) => {
    const num = parseFloat(value);
    setEditValues((prev) => ({ ...prev, [catId]: isNaN(num) ? 0 : Math.max(0, num) }));
  };

  const saveMutation = useMutation({
    mutationFn: (items: Array<{ category: string; amount: number }>) =>
      upsertBudgets({ month: monthKey, budgets: items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const copyMutation = useMutation({
    mutationFn: () => {
      const prev = month === 1
        ? `${year - 1}-12-01`
        : `${year}-${String(month - 1).padStart(2, '0')}-01`;
      return copyBudgets({ targetMonth: monthKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const handleSave = () => {
    const items = expenseCats
      .filter((cat) => (editValues[cat.id] || 0) > 0)
      .map((cat) => ({ category: cat.id, amount: editValues[cat.id] || 0 }));
    if (items.length === 0) return;
    saveMutation.mutate(items);
  };

  const getProgressColor = (status: string): string => {
    switch (status) {
      case 'over': return '#D85A30';
      case 'warning': return '#F59E0B';
      default: return '#1D9E75';
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="touch-target text-text-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-base font-semibold">预算管理</h1>
      </div>

      <div className="bg-white border-b border-gray-100">
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      <div className="px-4 pt-4 pb-20 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Copy from last month */}
            <button
              onClick={() => copyMutation.mutate()}
              disabled={copyMutation.isPending}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-text-secondary active:bg-gray-50"
            >
              {copyMutation.isPending ? '复制中...' : '复制上月预算'}
            </button>

            {/* Expense budgets */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-sm font-semibold">支出分类预算</h2>
              </div>
              {expenseCats.length === 0 ? (
                <EmptyState icon="💰" title="暂无支出分类" />
              ) : (
                expenseCats.map((cat, idx) => {
                  const budget = editValues[cat.id] || 0;
                  const st = statusMap.get(cat.id);
                  const spent = st?.spent || 0;
                  const progress = st?.progress || 0;
                  const status = st?.status || 'safe';

                  return (
                    <div
                      key={cat.id}
                      className={`px-4 py-3.5 ${idx < expenseCats.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="flex-1 text-sm font-medium">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-text-secondary">¥</span>
                          <input
                            type="number"
                            value={editValues[cat.id] === 0 ? '' : editValues[cat.id]}
                            onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                            min="0"
                            step="100"
                            placeholder="0"
                            inputMode="decimal"
                            className="w-20 text-right text-sm font-semibold outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      {budget > 0 && (
                        <div className="flex items-center gap-2 pl-8">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(progress, 100)}%`,
                                backgroundColor: getProgressColor(status),
                              }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary" style={{ color: getProgressColor(status) }}>
                            ¥{spent.toFixed(0)} / ¥{budget.toFixed(0)} ({progress}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Income categories (read-only) */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-sm font-semibold">收入分类</h2>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-text-secondary mb-2">收入分类不设预算</p>
                <div className="flex flex-wrap gap-2">
                  {incomeCats.map((cat) => (
                    <span key={cat.id} className="text-xs bg-gray-50 px-2.5 py-1 rounded-full">
                      {cat.icon} {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-medium active:bg-primary-light disabled:opacity-50"
            >
              {saveMutation.isPending ? '保存中...' : '保存预算'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BudgetsPage;
