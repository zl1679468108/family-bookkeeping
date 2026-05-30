/**
 * Statistics page — Expense/income tabs, pie chart + trend bar chart.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as echarts from 'echarts';
import TabBar from '../components/TabBar';
import MonthPicker from '../components/MonthPicker';
import EmptyState from '../components/EmptyState';
import { fetchCategoryBreakdown, fetchMonthlyTrend } from '../services/statisticsApi';
import { useCategories } from '../hooks/useCategories';

type EChartsInstance = echarts.ECharts;

const Statistics: React.FC = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<'expense' | 'income'>('expense');

  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pieInstanceRef = useRef<EChartsInstance | null>(null);
  const barInstanceRef = useRef<EChartsInstance | null>(null);

  const dateRange = useMemo(() => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }, [year, month]);

  // Category breakdown
  const { data: breakdownData, isLoading: breakdownLoading } = useQuery({
    queryKey: ['statistics', 'category-breakdown', dateRange, tab],
    queryFn: () => fetchCategoryBreakdown({ startDate: dateRange.start, endDate: dateRange.end, type: tab }),
    staleTime: 60_000,
  });

  // Monthly trend (single type)
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['statistics', 'monthly-trend', tab, dateRange.end],
    queryFn: () => fetchMonthlyTrend({ months: 6, endDate: dateRange.end, type: tab }),
    staleTime: 60_000,
  });

  const { data: categories } = useCategories();

  // Pie chart
  useEffect(() => {
    if (!pieRef.current || !breakdownData || breakdownData.length === 0) return;
    if (pieInstanceRef.current) pieInstanceRef.current.dispose();
    pieInstanceRef.current = echarts.init(pieRef.current);
    const instance = pieInstanceRef.current;
    instance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 10 }, itemWidth: 8, itemHeight: 8 },
      series: [{
        type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
        data: breakdownData.map((item) => ({
          name: item.category_name,
          value: item.amount,
          itemStyle: { color: getCategoryColor(item.category_name) },
        })),
      }],
    });
    instance.off('click');
    instance.on('click', (params: { name: string }) => {
      const cat = categories?.find((c) => c.name === params.name);
      if (cat) navigate(`/transactions?category=${cat.id}&type=${tab}`);
    });
    const h = () => instance.resize();
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); pieInstanceRef.current?.dispose(); pieInstanceRef.current = null; };
  }, [breakdownData, categories, navigate, tab]);

  // Trend bar chart
  useEffect(() => {
    if (!barRef.current || !trendData || trendData.length === 0) return;
    if (barInstanceRef.current) barInstanceRef.current.dispose();
    barInstanceRef.current = echarts.init(barRef.current);
    const instance = barInstanceRef.current;
    const months = trendData.map((item) => item.month.slice(5));
    const values = trendData.map((item) => item.amount || 0);
    const color = tab === 'expense' ? '#D85A30' : '#1D9E75';
    instance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 10, right: 10, top: 10, bottom: 20, containLabel: true },
      xAxis: { type: 'category', data: months, axisTick: { show: false }, axisLine: { lineStyle: { color: '#e5e5e5' } }, axisLabel: { fontSize: 10, color: '#999' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { fontSize: 10, color: '#999', formatter: (val: number) => val >= 10000 ? `${(val / 10000).toFixed(0)}万` : String(val) } },
      series: [{ type: 'bar', data: values, itemStyle: { color, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 20 }],
    });
    const h = () => instance.resize();
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('resize', h); barInstanceRef.current?.dispose(); barInstanceRef.current = null; };
  }, [trendData, tab]);

  useEffect(() => () => {
    pieInstanceRef.current?.dispose(); pieInstanceRef.current = null;
    barInstanceRef.current?.dispose(); barInstanceRef.current = null;
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-white border-b border-gray-100">
        <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex">
        {(['expense', 'income'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary'}`}>
            {t === 'expense' ? '支出分析' : '收入分析'}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-20 space-y-4">
        {/* Pie */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-1">分类{tab === 'expense' ? '支出' : '收入'}占比</h2>
          {breakdownLoading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : !breakdownData || breakdownData.length === 0 ? (
            <EmptyState title="暂无数据" />
          ) : (
            <div ref={pieRef} className="w-full" style={{ height: 280 }} />
          )}
        </div>

        {/* Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-sm font-semibold mb-1">月度{tab === 'expense' ? '支出' : '收入'}趋势</h2>
          {trendLoading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : !trendData || trendData.length === 0 ? (
            <EmptyState title="暂无数据" />
          ) : (
            <div ref={barRef} className="w-full" style={{ height: 240 }} />
          )}
        </div>
      </div>

      <TabBar />
    </div>
  );
};

const COLOR_PALETTE = ['#0F6E56', '#1D9E75', '#D85A30', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];
let colorIndex = 0;
const colorCache: Record<string, string> = {};
function getCategoryColor(name: string): string {
  if (colorCache[name]) return colorCache[name];
  colorCache[name] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  colorIndex++;
  return colorCache[name];
}

export default Statistics;
