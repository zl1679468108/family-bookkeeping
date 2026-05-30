/**
 * Home page — Card-flow layout with monthly overview, recent transactions, and FAB.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TabBar from '../components/TabBar';
import MonthPicker from '../components/MonthPicker';
import SummaryCard from '../components/SummaryCard';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import { getTransactions } from '../services/transactionsApi';
import { fetchBudgetStatus } from '../services/budgetsApi';
import { fetchSummary } from '../services/statisticsApi';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Build date range for the selected month
  const dateRange = useMemo(() => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }, [year, month]);

  const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;

  // Fetch summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['statistics', 'summary', dateRange],
    queryFn: () => fetchSummary({ startDate: dateRange.start, endDate: dateRange.end }),
    staleTime: 60 * 1000,
  });

  // Fetch budget status
  const { data: budgetStatus, isLoading: budgetLoading } = useQuery({
    queryKey: ['budgets', 'status', monthKey],
    queryFn: () => fetchBudgetStatus(monthKey),
    staleTime: 60 * 1000,
  });

  // Fetch recent transactions
  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', 'home', dateRange],
    queryFn: () =>
      getTransactions({
        startDate: dateRange.start,
        endDate: dateRange.end,
        page: 1,
        pageSize: 5,
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    staleTime: 30 * 1000,
  });

  // Categories lookup
  const { data: categories } = useCategories();

  const categoryMap = useMemo(() => {
    const map: Record<string, Category> = {};
    categories?.forEach((c: Category) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Month picker */}
      <div className="bg-white border-b border-gray-100">
        <MonthPicker year={year} month={month} onChange={handleMonthChange} />
      </div>

      <div className="px-4 pt-4 pb-20 space-y-3">
        {/* Summary Card or skeleton */}
        {budgetLoading || summaryLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-36 rounded-2xl" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-12 rounded-xl" />
              <div className="skeleton h-12 rounded-xl" />
            </div>
          </div>
        ) : (
        <div className="space-y-3">
        {/* Summary Card */}
        <SummaryCard
          totalExpense={summary?.totalExpense ?? 0}
          totalIncome={summary?.totalIncome ?? 0}
          balance={summary?.balance ?? 0}
          budgetTotal={budgetStatus?.totalBudget}
          budgetSpent={budgetStatus?.totalSpent}
        />

        {/* Budget Alerts */}
        {budgetStatus && budgetStatus.totalBudget > 0 && budgetStatus.alerts && budgetStatus.alerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {budgetStatus.alerts.some((a: any) => a.progress >= 100) ? '预算超支' : '预算预警'}
              </h2>
              <button onClick={() => navigate('/budgets')} className="text-xs text-primary font-medium">调整预算</button>
            </div>
            {budgetStatus.alerts.slice(0, 3).map((alert: any) => {
              const cat = categoryMap[alert.category_id];
              const isOver = alert.progress >= 100;
              return (
                <div
                  key={alert.category_id}
                  onClick={() => navigate('/budgets')}
                  className="flex items-center gap-3 py-2"
                >
                  <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isOver ? 'bg-[#D85A30]' : 'bg-[#F59E0B]'}`} />
                  <span className="text-lg">{cat?.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{cat?.name || '未知'}</span>
                      <span className={`text-xs font-semibold ${isOver ? 'text-[#D85A30]' : 'text-[#F59E0B]'}`}>{alert.progress}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isOver ? 'bg-[#D85A30]' : 'bg-[#F59E0B]'}`} style={{ width: `${Math.min(alert.progress, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-text-secondary">¥{alert.spent.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {budgetStatus.alerts.length > 3 && (
              <p className="text-xs text-text-secondary mt-1">还有 {budgetStatus.alerts.length - 3} 个分类超支...</p>
            )}
          </div>
        )}
        </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold">最近交易</h2>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-primary font-medium"
            >
              查看全部
            </button>
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactionsData?.data.length === 0 ? (
            <EmptyState
              icon="💳"
              title="暂无交易记录"
              description="点击下方 + 开始记账"
              action={{
                label: '记一笔',
                onClick: () => navigate('/add'),
              }}
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {transactionsData?.data.map((tx) => {
                const cat = categoryMap[tx.category];
                return (
                  <TransactionItem
                    key={tx.id}
                    icon={cat?.icon || '📌'}
                    categoryName={cat?.name || '未知'}
                    description={tx.description}
                    amount={tx.amount}
                    type={tx.type}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar (includes FAB) */}
      <TabBar />
    </div>
  );
};

export default Home;
