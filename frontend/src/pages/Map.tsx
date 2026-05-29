import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { MapCanvas } from '../components/MapCanvas';
import { MerchantList } from '../components/MerchantList';
import { fetchMapTransactions, fetchMerchantSummary } from '../services/mapApi';
import { useCategories } from '../hooks/useCategories';
import type { MapFilters } from '../types/map';
import { startOfMonth, format } from 'date-fns';
import './Map.scss';

type ViewMode = 'footprints' | 'heatmap' | 'list';

const MapPage: React.FC = () => {
  const today = new Date();
  const [filters, setFilters] = useState<MapFilters>({
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  });
  const [viewMode, setViewMode] = useState<ViewMode>('footprints');

  const { data: categories = [] } = useCategories();

  // 获取交易数据（热力图需要原始交易数据）
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['map', 'transactions', filters.startDate, filters.endDate, filters.type, filters.categories?.join(',')],
    queryFn: () => fetchMapTransactions(filters),
  });

  // 获取商户汇总（始终获取，避免切换时重新请求）
  const { data: merchants = [] } = useQuery({
    queryKey: ['map', 'merchants', filters.startDate, filters.endDate, filters.type],
    queryFn: () => fetchMerchantSummary(filters),
  });

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleCategoryToggle = useCallback((cat: string) => {
    setFilters((prev) => {
      const current = prev.categories || [];
      if (current.includes(cat)) {
        return { ...prev, categories: current.filter((c) => c !== cat) };
      }
      return { ...prev, categories: [...current, cat] };
    });
  }, []);

  const handleTypeChange = useCallback((type?: 'income' | 'expense') => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  // 统计摘要
  const totalPoints = viewMode === 'footprints' || viewMode === 'list'
    ? merchants.length
    : transactions.length;
  const totalAmount = viewMode === 'footprints' || viewMode === 'list'
    ? merchants.reduce((sum, m) => sum + m.total_amount, 0)
    : transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="map-page">
      <Header title="消费地图" />

      {/* 筛选栏 */}
      <div className="map-toolbar">
        <div className="map-toolbar-row">
          <DateRangeFilter
            startDate={filters.startDate || ''}
            endDate={filters.endDate || ''}
            onChange={handleDateRangeChange}
          />

          {/* 类型筛选 */}
          <div className="map-type-filter">
            <button
              className={`map-chip ${!filters.type ? 'active' : ''}`}
              onClick={() => handleTypeChange(undefined)}
            >全部</button>
            <button
              className={`map-chip ${filters.type === 'expense' ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >支出</button>
            <button
              className={`map-chip ${filters.type === 'income' ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
            >收入</button>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="map-category-filter">
          {categories.map((cat: any) => {
            const selected = (filters.categories || []).includes(cat.id);
            return (
              <button
                key={cat.id}
                className={`map-chip mini ${selected ? 'active' : ''}`}
                onClick={() => handleCategoryToggle(cat.id)}
              >
                {cat.icon || ''} {cat.name}
              </button>
            );
          })}
        </div>

        {/* 视图切换 */}
        <div className="map-toolbar-row map-toolbar-bottom">
          <div className="map-view-toggle">
            <button className={`map-chip ${viewMode === 'footprints' ? 'active' : ''}`} onClick={() => setViewMode('footprints')}>👣 足迹</button>
            <button
              className={`map-chip ${viewMode === 'heatmap' ? 'active' : ''} ${transactions.length < 5 ? 'disabled' : ''}`}
              onClick={() => transactions.length >= 5 && setViewMode('heatmap')}
              disabled={transactions.length < 5}
              title={transactions.length < 5 ? '至少需要5个消费点' : '热力图'}
            >🔥 热力</button>
            <button className={`map-chip ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📋 列表</button>
          </div>
          <div className="map-stats">
            <span className="map-stat-item">
              📌 <strong>{totalPoints}</strong> 个{viewMode === 'heatmap' ? '消费点' : '商户'}
            </span>
            <span className="map-stat-item">
              💰 <strong>¥ {totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 主体内容 — 三个面板始终渲染，CSS 切显隐，避免地图重新初始化 */}
      <div className="map-content">
        <div className={`map-panel ${viewMode === 'footprints' || viewMode === 'heatmap' ? 'active' : ''}`}>
          <MapCanvas
            data={transactions}
            merchants={merchants}
            viewMode={viewMode === 'list' ? 'footprints' : viewMode}
          />
        </div>
        <div className={`map-panel ${viewMode === 'list' ? 'active' : ''}`}>
          <MerchantList merchants={merchants} loading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
