import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { MapCanvas } from './components/MapCanvas';
import type { MapCanvasHandle } from './components/MapCanvas';
import { MerchantList } from './components/MerchantList';
import { MemberFilter } from './components/MemberFilter';
import { MemberLocationToggle } from './components/MemberLocationToggle';
import { MemberLocationLayer } from './components/MemberLocationLayer';
import { fetchMapTransactions, fetchMerchantSummary } from '../../services/mapApi';
import { useCategories } from '../../hooks/useCategories';
import { useLocationSharing } from '../../hooks/useLocationSharing';
import { useMemberColors } from '../../hooks/useMemberColors';
import { useBook } from '../../hooks/useBook';
import type { MapFilters } from '../../types/map';
import { startOfMonth, format } from 'date-fns';
import './index.scss';

type ViewMode = 'footprints' | 'heatmap' | 'list';

const MapPage: React.FC = () => {
  const today = new Date();

  // ---- 账本与成员 ----
  const { currentBook } = useBook();
  const bookId = currentBook?.id;
  const { members, colorMap, isMultiMember } = useMemberColors(bookId);

  // ---- 位置共享 ----
  const { isSharing, setIsSharing, locationError } = useLocationSharing(bookId);

  // ---- 地图实例引用 (用于 MemberLocationLayer) ----
  const mapCanvasRef = useRef<MapCanvasHandle>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // ---- 筛选状态 ----
  const [filters, setFilters] = useState<MapFilters>({
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  });
  const [viewMode, setViewMode] = useState<ViewMode>('footprints');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // ---- 成员 ID 计算 ----
  const memberIds = useMemo(() => {
    if (!isMultiMember) return undefined;
    if (selectedMemberId) return [selectedMemberId];
    return members.map((m) => m.userId);
  }, [isMultiMember, selectedMemberId, members]);

  const { data: allCategories = [] } = useCategories();

  // 根据当前筛选类型过滤并排序分类：支出在前，收入在后
  const categories = useMemo(() => {
    const filtered = filters.type
      ? allCategories.filter((c: any) => c.type === filters.type)
      : allCategories;
    return [...filtered].sort((a: any, b: any) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [allCategories, filters.type]);

  // ---- 查询参数 ----
  const transactionsQueryKey = useMemo(() => [
    'map', 'transactions',
    filters.startDate, filters.endDate, filters.type,
    filters.categories?.join(','),
    memberIds?.join(','),
  ], [filters.startDate, filters.endDate, filters.type, filters.categories, memberIds]);

  const merchantsQueryKey = useMemo(() => [
    'map', 'merchants',
    filters.startDate, filters.endDate, filters.type,
    filters.categories?.join(','),
    memberIds?.join(','),
  ], [filters.startDate, filters.endDate, filters.type, filters.categories, memberIds]);

  // 获取交易数据（热力图需要原始交易数据）
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => fetchMapTransactions({ ...filters, memberIds }),
  });

  // 获取商户汇总
  const { data: merchants = [] } = useQuery({
    queryKey: merchantsQueryKey,
    queryFn: () => fetchMerchantSummary({ ...filters, memberIds }),
  });

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate }));
  };

  const handleCategoryToggle = useCallback((cat: string) => {
    setFilters((prev) => {
      // 单选：点击已选中则取消，否则替换为新分类
      const current = prev.categories || [];
      const next = current.includes(cat) ? [] : [cat];
      return { ...prev, categories: next };
    });
  }, []);

  const handleTypeChange = useCallback((type?: 'income' | 'expense') => {
    setFilters((prev) => {
      // 切换类型时清除不兼容的分类筛选
      let categories = prev.categories;
      if (type && categories?.length) {
        const validIds = allCategories.filter((c: any) => c.type === type).map((c: any) => c.id);
        categories = categories.filter((id) => validIds.includes(id));
      }
      return { ...prev, type, categories: categories?.length ? categories : undefined };
    });
  }, [allCategories]);

  // 统计摘要
  const totalPoints = viewMode === 'footprints' || viewMode === 'list'
    ? merchants.length
    : transactions.length;
  const totalAmount = viewMode === 'footprints' || viewMode === 'list'
    ? merchants.reduce((sum, m) => sum + m.total_amount, 0)
    : transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="page-container map-page">
      <Header title="消费地图" />

      {/* 筛选栏 */}
      <div className="map-toolbar">
        {/* ---- P1: 多成员功能行 ---- */}
        {isMultiMember && (
          <div className="map-toolbar-row map-toolbar-p1">
            <MemberLocationToggle
              isSharing={isSharing}
              onToggle={() => setIsSharing(!isSharing)}
              locationError={locationError}
            />
            <MemberFilter
              members={members}
              colorMap={colorMap}
              selectedId={selectedMemberId}
              onChange={setSelectedMemberId}
            />
          </div>
        )}

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
            ref={mapCanvasRef}
            data={transactions}
            merchants={merchants}
            viewMode={viewMode === 'list' ? 'footprints' : viewMode}
            members={members}
            colorMap={colorMap}
            selectedMemberId={selectedMemberId}
            onMapReady={setMapInstance}
          />
          <MemberLocationLayer bookId={bookId} mapInstance={mapInstance} />
        </div>
        <div className={`map-panel ${viewMode === 'list' ? 'active' : ''}`}>
          <MerchantList merchants={merchants} loading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
