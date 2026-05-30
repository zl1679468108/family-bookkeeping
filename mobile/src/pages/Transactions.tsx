/**
 * Transactions page — Full transaction list with sliding delete.
 * Type filter, category filter, search, URL params, infinite scroll.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TabBar from '../components/TabBar';
import FilterBar from '../components/FilterBar';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import { getTransactions, deleteTransaction } from '../services/transactionsApi';
import { useCategories } from '../hooks/useCategories';
import type { Category, Transaction } from '../types';

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const now = new Date();

  // Read URL params for drill-down
  const urlCategory = searchParams.get('category') || '';
  const urlType = (searchParams.get('type') as 'all' | 'income' | 'expense') || 'all';
  const urlStartDate = searchParams.get('startDate') || '';
  const urlEndDate = searchParams.get('endDate') || '';

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(urlType);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(urlCategory || null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const dateRange = useMemo(() => {
    if (urlStartDate && urlEndDate) return { start: urlStartDate, end: urlEndDate };
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }, [year, month, urlStartDate, urlEndDate]);

  const { data: categories } = useCategories();

  const queryKey = ['transactions', 'list', dateRange, typeFilter, categoryFilter, search, page];
  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      getTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
        page,
        pageSize: 20,
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    staleTime: 30_000,
  });

  // Accumulate pages in a ref — filter changes reset it, new pages append.
  // Computed inline during render so we never miss a data update, even when
  // react-query's structuralSharing returns the same reference.
  const pagesRef = useRef<Map<number, Transaction[]>>(new Map());
  const lastFilterKeyRef = useRef('');
  const filterKey = `${year}-${month}-${typeFilter}-${categoryFilter || ''}-${search}`;

  // Reset pages when any filter changes
  if (lastFilterKeyRef.current !== filterKey) {
    lastFilterKeyRef.current = filterKey;
    pagesRef.current = new Map();
  }

  // Store page data once the query has settled (not loading, not fetching)
  if (!isLoading && !isFetching && data?.data?.length) {
    pagesRef.current.set(page, data.data);
  }

  const allTransactions = useMemo(
    () =>
      Array.from(pagesRef.current.entries())
        .sort(([a], [b]) => a - b)
        .flatMap(([, txs]) => txs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, data, isLoading, isFetching],
  );

  const hasMore = (data?.data?.length || 0) >= 20;

  // Reset page when filters change (data reset is handled inline via pagesRef)
  useEffect(() => {
    setPage(1);
  }, [year, month, typeFilter, categoryFilter, search]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !hasMore || isFetching) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      setPage((p) => p + 1);
    }
  }, [hasMore, isFetching]);

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories?.forEach((c: Category) => { map[c.id] = c; });
    return map;
  }, [categories]);

  const categoryOptions = useMemo(
    () => (categories || []).filter((c) => c.type === 'expense').map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
    [categories],
  );

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDeleteTarget(null);
    },
  });

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    allTransactions.forEach((tx) => {
      const dk = tx.date.split('T')[0];
      if (!groups[dk]) groups[dk] = [];
      groups[dk].push(tx);
    });
    return groups;
  }, [allTransactions]);

  const formatDateLabel = (ds: string) => {
    const d = new Date(ds);
    const t = new Date();
    const y = new Date(t); y.setDate(y.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return '今天';
    if (d.toDateString() === y.toDateString()) return '昨天';
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
  };

  const dailySummary = (txs: Transaction[]) => {
    let inc = 0, exp = 0;
    txs.forEach((tx) => { if (tx.type === 'income') inc += tx.amount; else exp += tx.amount; });
    return { income: inc, expense: exp };
  };

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <FilterBar
        year={year} month={month}
        onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
        onCategoryChange={setCategoryFilter}
        onSearch={setSearch}
        onTypeChange={setTypeFilter}
        activeType={typeFilter}
        categoryOptions={categoryOptions}
      />

      <div className="flex-1 overflow-y-auto pb-20" ref={scrollContainerRef} onScroll={handleScroll}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedDates.length === 0 ? (
          <EmptyState icon="📭" title="暂无交易记录" description="还没有这个月的交易数据" />
        ) : (
          <div>
            {sortedDates.map((dk) => {
              const sum = dailySummary(grouped[dk]);
              return (
                <div key={dk}>
                  <div className="px-4 py-3 bg-bg sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <span className="date-accent flex-shrink-0" />
                      {formatDateLabel(dk)}
                    </span>
                      <div className="flex gap-3">
                        {sum.expense > 0 && <span className="text-xs text-[#D85A30]">支出 ¥{sum.expense.toFixed(2)}</span>}
                        {sum.income > 0 && <span className="text-xs text-[#1D9E75]">收入 ¥{sum.income.toFixed(2)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden mb-3">
                    {grouped[dk].map((tx) => {
                      const cat = categoryMap[tx.category];
                      return (
                        <TransactionItem
                          key={tx.id}
                          icon={cat?.icon || '📌'}
                          categoryName={cat?.name || '未知'}
                          description={tx.description}
                          amount={tx.amount}
                          type={tx.type}
                          onClick={() => navigate(`/add?edit=${tx.id}`)}
                          onDelete={() => setDeleteTarget(tx)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {isFetching && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <TabBar />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl mx-8 p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-text-secondary mb-5">确定删除这笔交易记录吗？不可恢复。</p>
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

export default Transactions;
