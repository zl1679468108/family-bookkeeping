import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapCanvas } from './components/MapCanvas';
import type { MapCanvasHandle } from './components/MapCanvas';
import { MerchantList } from './components/MerchantList';
import { MemberLocationToggle } from './components/MemberLocationToggle';
import { MemberLocationLayer } from './components/MemberLocationLayer';
import { DropdownSelect } from '../../components/ui/dropdown';
import type { DropdownOption } from '../../components/ui/dropdown';
import { fetchMapTransactions, fetchMerchantSummary } from '../../services/mapApi';
import { useCategories } from '../../hooks/useCategories';
import { useLocationSharing } from '../../hooks/useLocationSharing';
import { useMemberColors } from '../../hooks/useMemberColors';
import { useBook } from '../../hooks/useBook';
import type { MapFilters } from '../../types/map';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
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

  // ---- 地图实例引用 ----
  const mapCanvasRef = useRef<MapCanvasHandle>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // ---- 筛选状态 ----
  const [filters, setFilters] = useState<MapFilters>({
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  });
  const [viewMode, setViewMode] = useState<ViewMode>('footprints');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // 成员 ID 计算
  const memberIds = useMemo(() => {
    if (!isMultiMember) return undefined;
    if (selectedMemberId) return [selectedMemberId];
    return members.map((m) => m.userId);
  }, [isMultiMember, selectedMemberId, members]);

  // 分类筛选数据
  const { data: allCategories = [] }: any = useCategories();

  // ---- 查询参数 ----
  const transactionsQueryKey = useMemo(
    () => [
      'map',
      'transactions',
      filters.startDate,
      filters.endDate,
      filters.type,
      filters.categories?.join(','),
      memberIds?.join(','),
    ],
    [filters.startDate, filters.endDate, filters.type, filters.categories, memberIds],
  );

  const merchantsQueryKey = useMemo(
    () => [
      'map',
      'merchants',
      filters.startDate,
      filters.endDate,
      filters.type,
      filters.categories?.join(','),
      memberIds?.join(','),
    ],
    [filters.startDate, filters.endDate, filters.type, filters.categories, memberIds],
  );

  // 获取交易数据（热力图需要原始交易数据
  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => fetchMapTransactions({ ...filters, memberIds }),
  });

  // 获取商户汇总
  const { data: merchants = [], isLoading: isMerchantLoading } = useQuery({
    queryKey: merchantsQueryKey,
    queryFn: () => fetchMerchantSummary({ ...filters, memberIds }),
  });

  // 合并加载状态：任一查询在途即视为加载中
  const mapLoading = isTxLoading || isMerchantLoading;

  // ---- 日期范围下拉：全部 / 本月 / 近 6 月 / 近 1 年 ----
  const dateRangeOptions: DropdownOption[] = [
    { key: 'all', label: '全部', icon: '📅' },
    { key: 'this-month', label: '本月', icon: '📅' },
    { key: 'last-6', label: '近 6 月', icon: '📅' },
    { key: 'last-1', label: '近 1 年', icon: '📅' },
  ];

  const activeDateKey = useMemo(() => {
    const presets: Record<string, { start: string; end: string }> = {
      'this-month': {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd'),
      },
      'last-6': {
        start: format(startOfMonth(subMonths(today, 5)), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd'),
      },
      'last-1': {
        start: format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd'),
      },
    };
    if (!filters.startDate && !filters.endDate) return 'all';
    for (const [k, r] of Object.entries(presets)) {
      if (r.start === filters.startDate && r.end === filters.endDate) return k;
    }
    return 'this-month';
  }, [filters.startDate, filters.endDate, today]);

  const handleDateSelect = (key: string) => {
    if (key === 'all') {
      setFilters((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
      return;
    }
    let start: Date;
    let end: Date;
    switch (key) {
      case 'this-month':
        start = startOfMonth(today); end = endOfMonth(today); break;
      case 'last-6':
        start = startOfMonth(subMonths(today, 5)); end = endOfMonth(today); break;
      case 'last-1':
        start = startOfMonth(subMonths(today, 11)); end = endOfMonth(today); break;
      default:
        return;
    }
    setFilters((prev) => ({
      ...prev,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    }));
  };

  // ---- 类型筛选 ----
  const typeOptions: DropdownOption[] = [
    { key: 'expense', label: '支出', icon: '📤' },
    { key: 'income', label: '收入', icon: '📥' },
  ];
  const activeTypeKey = filters.type ?? null;
  const handleTypeSelect = (key: string) => {
    const type = (key === 'expense' || key === 'income') ? key : undefined;
    setFilters((prev) => ({ ...prev, type, categories: undefined }));
  };

  // ---- 分类筛选下拉 ----
  const categoryOptions: DropdownOption[] = useMemo(() => {
    const filtered = filters.type
      ? allCategories.filter((c: any) => c.type === filters.type)
      : allCategories;
    return filtered
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((c: any) => ({ key: c.id, label: c.name, icon: c.icon || '' }));
  }, [allCategories, filters.type]);

  // 当前分类下拉选中 key
  const selectedCategoryKey = useMemo(
    () => (filters.categories && filters.categories.length > 0 ? filters.categories[0] : null),
    [filters.categories],
  );

  const handleCategorySelect = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: key ? [key] : undefined,
    }));
  };

  // ---- 成员筛选 ----
  const memberOptions: DropdownOption[] = useMemo(() => {
    return members.map((m) => ({
      key: m.userId,
      label: m.username,
      color: colorMap.get(m.userId) || '#999',
    }));
  }, [members, colorMap]);

  // ---- 视图切换 ----
  const viewOptions: DropdownOption[] = [
    { key: 'footprints', label: '足迹', icon: '👣' },
    { key: 'heatmap', label: '热力图', icon: '🔥' },
    { key: 'list', label: '列表', icon: '📋' },
  ];
  const handleViewSelect = (key: string) => {
    if (key === 'heatmap' && transactions.length < 5) return;
    if (key === 'footprints' || key === 'heatmap' || key === 'list') {
      setViewMode(key);
    }
  };

  return (
    <div className="page-container map-page">
      {/* ==== 工具条卡片 ==== */}
      <div className="map-toolbar-card">
        <div className="map-toolbar-row">
          {/* 视图切换（放第一个） */}
          <DropdownSelect
            label="视图"
            options={viewOptions}
            value={viewMode}
            onChange={handleViewSelect}
            placeholder="视图"
            allowClear={false}
          />

          {/* 位置共享按钮 */}
          {isMultiMember && (
            <MemberLocationToggle
              isSharing={isSharing}
              onToggle={() => setIsSharing(!isSharing)}
              locationError={locationError}
            />
          )}

          {/* 成员筛选 */}
          {isMultiMember && (
            <DropdownSelect
              label="成员"
              options={memberOptions}
              value={selectedMemberId}
              onChange={(key) => setSelectedMemberId(key || null)}
              placeholder="全部成员"
            />
          )}

          {/* 日期 */}
          <DropdownSelect
            label="日期"
            options={dateRangeOptions}
            value={activeDateKey}
            onChange={handleDateSelect}
            placeholder="全部"
            allowClear={false}
          />

          {/* 类型 */}
          <DropdownSelect
            label="类型"
            options={typeOptions}
            value={activeTypeKey}
            onChange={handleTypeSelect}
            placeholder="全部"
          />

          {/* 分类 */}
          <DropdownSelect
            label="分类"
            options={categoryOptions}
            value={selectedCategoryKey}
            onChange={handleCategorySelect}
            placeholder="全部分类"
          />

          <div className="map-toolbar-spacer" />

          <div className="map-stats-inline">
            <span className="map-stat-chip">
              📌 <strong>{viewMode === 'heatmap' ? transactions.length : merchants.length}</strong> 个{viewMode === 'heatmap' ? '消费点' : '商户'}
            </span>
            <span className="map-stat-chip">
              💰 <strong>¥ {(viewMode === 'heatmap'
                ? transactions.reduce((sum, t) => sum + Number(t.amount), 0)
                : merchants.reduce((sum, m) => sum + m.total_amount, 0)
              ).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ==== 主体内容 — 地图 / 列表 ==== */}
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
          {/* 加载进度条：仅在地图视图下显示 */}
          {(viewMode === 'footprints' || viewMode === 'heatmap') && mapLoading && (
            <div className="map-loading-overlay" role="status" aria-label="加载中">
              <div className="map-loading-spinner" />
              <div className="map-loading-text">正在加载数据…</div>
              <div className="map-loading-bar"><div className="map-loading-bar-inner" /></div>
            </div>
          )}
        </div>
        <div className={`map-panel ${viewMode === 'list' ? 'active' : ''}`}>
          <MerchantList merchants={merchants} loading={mapLoading} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
