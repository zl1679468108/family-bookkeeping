import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '../../components/Header';
import { MapCanvas } from './components/MapCanvas';
import type { MapCanvasHandle } from './components/MapCanvas';
import { MerchantList } from './components/MerchantList';
import { MemberLocationToggle } from './components/MemberLocationToggle';
import { MemberLocationLayer } from './components/MemberLocationLayer';
import { DropdownSelect } from '../../components/ui/dropdown';
import type { DropdownOption } from '../../components/ui/dropdown';
import { fetchMapTransactions, fetchMerchantSummary } from '../../services/mapApi';
import { AmapManager } from '../../services/amapManager';
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

  // ---- 自定义日期面板 ----
  const [showCustomDate, setShowCustomDate] = useState(false);

  // ---- POI 搜索状态 (工具条内) ----
  const [searchText, setSearchText] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // 成员 ID 计算
  const memberIds = useMemo(() => {
    if (!isMultiMember) return undefined;
    if (selectedMemberId) return [selectedMemberId];
    return members.map((m) => m.userId);
  }, [isMultiMember, selectedMemberId, members]);

  const { data: allCategories = [] } = useCategories();

  // 分类筛选下拉选项（带类型标记）
  const categoryOptions: DropdownOption[] = useMemo(() => {
    return allCategories
      .slice()
      .sort((a: any, b: any) => {
        if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      })
      .map((c: any) => ({
        key: c.id,
        label: c.name,
        icon: c.icon || '',
      }));
  }, [allCategories]);

  // 当前分类下拉选中 key
  const selectedCategoryKey = useMemo(
    () => (filters.categories && filters.categories.length > 0 ? filters.categories[0] : null),
    [filters.categories],
  );

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

  // ---- 日期范围 ----
  const dateRangeOptions: DropdownOption[] = [
    { key: 'this-month', label: '本月', icon: '📅' },
    { key: 'last-month', label: '上月', icon: '📅' },
    { key: 'last-3', label: '近 3 月', icon: '📅' },
    { key: 'last-6', label: '近 6 月', icon: '📅' },
    { key: 'last-1', label: '近 1 年', icon: '📅' },
    { key: 'custom', label: '自定义', icon: '⚙️' },
  ];

  // 根据当前 startDate/endDate 反推预设 key
  const activeDateKey = useMemo(() => {
    const presets = [
      { key: 'this-month', range: { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') } },
      { key: 'last-month', range: { start: format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd'), end: format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd') } },
      { key: 'last-3', range: { start: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') } },
      { key: 'last-6', range: { start: format(startOfMonth(subMonths(today, 5)), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') } },
      { key: 'last-1', range: { start: format(startOfMonth(subMonths(today, 11)), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') } },
    ];
    for (const p of presets) {
      if (p.range.start === filters.startDate && p.range.end === filters.endDate) return p.key;
    }
    return showCustomDate ? 'custom' : 'this-month';
  }, [filters.startDate, filters.endDate, today, showCustomDate]);

  const handleDateSelect = (key: string) => {
    if (key === 'custom') {
      setShowCustomDate(true);
      return;
    }
    setShowCustomDate(false);
    let start: Date;
    let end: Date;
    switch (key) {
      case 'this-month':
        start = startOfMonth(today); end = endOfMonth(today); break;
      case 'last-month':
        start = startOfMonth(subMonths(today, 1)); end = endOfMonth(subMonths(today, 1)); break;
      case 'last-3':
        start = startOfMonth(subMonths(today, 2)); end = endOfMonth(today); break;
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
    setFilters((prev) => {
      // 切换类型时清除不兼容的分类筛选
      let cats = prev.categories;
      if (type && cats?.length) {
        const validIds = allCategories.filter((c: any) => c.type === type).map((c: any) => c.id);
        cats = cats.filter((id) => validIds.includes(id));
      }
      return { ...prev, type, categories: cats?.length ? cats : undefined };
    });
  };

  // ---- 分类筛选 ----
  const handleCategorySelect = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: key && key !== prev.categories?.[0] ? [key] : undefined,
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
    if (key === 'heatmap' && transactions.length < 5) return; // 不足数据时不切换
    if (key === 'footprints' || key === 'heatmap' || key === 'list') {
      setViewMode(key);
    }
  };

  // ---- POI 搜索 ----
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }
    if (!mapInstance) return;
    const AMap = AmapManager.getInstance().AMap;
    if (!AMap?.PlaceSearch) return;

    setSearching(true);
    const placeSearch = new AMap.PlaceSearch({ pageSize: 20, pageIndex: 1, city: '全国' });
    placeSearch.search(searchKeyword, (_status: string, result: any) => {
      setSearching(false);
      if (result?.poiList?.pois) {
        setSearchResults(result.poiList.pois);
      } else {
        setSearchResults([]);
      }
    });
  }, [searchKeyword, mapInstance]);

  const handleSearch = () => {
    setSearchKeyword(searchText.trim());
  };

  const handleSearchResultClick = (poi: any) => {
    const map = mapCanvasRef.current?.getMap?.();
    if (map && poi?.location) {
      map.setCenter([poi.location.lng, poi.location.lat]);
      map.setZoom(15);
    }
    setSearchResults([]);
    setSearchText('');
  };

  // 统计摘要
  const totalPoints = viewMode === 'footprints' || viewMode === 'list' ? merchants.length : transactions.length;
  const totalAmount = viewMode === 'footprints' || viewMode === 'list'
    ? merchants.reduce((sum, m) => sum + m.total_amount, 0)
    : transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // 视图标签
  const viewLabel = viewMode === 'heatmap' ? '消费点' : '商户';

  return (
    <div className="page-container map-page">
      <Header title="消费地图" />

      {/* ==== 工具条卡片 ==== */}
      <div className="map-toolbar-card">
        {/* 第一行：筛选下拉 + 位置共享 + 视图 */}
        <div className="map-toolbar-row">
          {isMultiMember && (
            <MemberLocationToggle
              isSharing={isSharing}
              onToggle={() => setIsSharing(!isSharing)}
              locationError={locationError}
            />
          )}

          <DropdownSelect
            label="日期"
            options={dateRangeOptions}
            value={activeDateKey}
            onChange={handleDateSelect}
            placeholder="全部"
          />

          <DropdownSelect
            label="类型"
            options={typeOptions}
            value={activeTypeKey}
            onChange={handleTypeSelect}
            placeholder="全部"
          />

          <DropdownSelect
            label="分类"
            options={categoryOptions}
            value={selectedCategoryKey}
            onChange={handleCategorySelect}
            placeholder="全部分类"
          />

          {isMultiMember && (
            <DropdownSelect
              label="成员"
              options={memberOptions}
              value={selectedMemberId}
              onChange={(key) => setSelectedMemberId(key || null)}
              placeholder="全部成员"
            />
          )}

          <DropdownSelect
            label="视图"
            options={viewOptions}
            value={viewMode}
            onChange={handleViewSelect}
            placeholder="视图"
          />

          <div className="map-toolbar-spacer" />

          <div className="map-stats-inline">
            <span className="map-stat-chip">
              📌 <strong>{totalPoints}</strong> 个{viewLabel}
            </span>
            <span className="map-stat-chip">
              💰 <strong>¥ {totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>

        {/* 自定义日期输入面板（仅点击"自定义"时显示） */}
        {showCustomDate && (
          <div className="map-toolbar-subrow">
            <span className="map-subrow-label">起止日期：</span>
            <input
              type="date"
              className="map-date-input"
              value={filters.startDate || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
            />
            <span className="map-date-sep">—</span>
            <input
              type="date"
              className="map-date-input"
              value={filters.endDate || ''}
              min={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
            />
            <button className="map-btn-secondary" onClick={() => setShowCustomDate(false)}>
              完成
            </button>
          </div>
        )}

        {/* 第二行：搜索框 */}
        <div className="map-toolbar-search">
          <input
            type="text"
            className="map-search-input"
            placeholder="搜索附近商户、地点、POI…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="map-search-btn" onClick={handleSearch} disabled={searching}>
            {searching ? '…' : '🔍 搜索'}
          </button>
          {searchResults.length > 0 && (
            <div className="map-search-panel">
              {searchResults.map((poi: any, i: number) => {
                const hasData = transactions.some((t: any) => t.poi_id === poi.id);
                return (
                  <div
                    key={i}
                    className={`map-search-item ${hasData ? 'has-data' : ''}`}
                    onClick={() => handleSearchResultClick(poi)}
                  >
                    <span className="map-search-item-icon">{hasData ? '✅' : '📍'}</span>
                    <span className="map-search-item-main">
                      <span className="map-search-item-name">{poi.name}</span>
                      <span className="map-search-item-addr">{poi.address}</span>
                    </span>
                  </div>
                );
              })}
              <button className="map-search-clear" onClick={() => { setSearchResults([]); setSearchText(''); }}>
                关闭
              </button>
            </div>
          )}
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
            hasExternalSearch={searchResults.length > 0}
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
