import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapCanvas } from './components/MapCanvas';
import type { MapCanvasHandle } from './components/MapCanvas';
import { MerchantDrawer } from './components/MerchantDrawer';
import { MemberLocationLayer } from './components/MemberLocationLayer';
import { DropdownSelect } from '../../components/ui/Dropdown';
import type { DropdownOption } from '../../components/ui/Dropdown';
import { Drawer } from '../../components/ui/Drawer';
import { useCategories } from '../../hooks/useCategories';
import { useMemberColors } from '../../hooks/useMemberColors';
import { useMonthRangeOptions } from '../../hooks/useMonthRangeOptions';
import { useBook } from '../../hooks/useBook';
import { renderCategoryIcon } from '../../utils/renderCategoryIcon';
import { fetchMapTransactions, fetchMerchantSummary } from '../../services/mapApi';
import type { MapFilters, MerchantSummary } from '../../types/map';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import './index.scss';

type ViewMode = 'footprints' | 'heatmap';

const MapPage: React.FC = () => {
  // ---- 账本与成员 ----
  const { currentBook } = useBook();
  const bookId = currentBook?.id;
  const { members, colorMap, isMultiMember } = useMemberColors(bookId);



  // ---- 地图实例引用 ----
  const mapCanvasRef = useRef<MapCanvasHandle>(null);

  // ---- 筛选状态 ----
  // 年月选择器（复用预算模块的 hook）
  const { monthOptions, currentMonthKey } = useMonthRangeOptions();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // 类型筛选
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | ''>('');

  // 分类筛选
  const { data: allCategories = [] }: any = useCategories();

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 成员筛选
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // 视图
  const [viewMode, setViewMode] = useState<ViewMode>('footprints');

  // 商户抽屉开关
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ---- 根据年月计算起止日期 ----
  const { startDate, endDate } = useMemo(() => {
    const date = new Date(selectedMonth);
    return {
      startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
    };
  }, [selectedMonth]);

  // ---- 构建 filters 传给 API ----
  const filters: MapFilters = useMemo(() => {
    return {
      startDate,
      endDate,
      type: selectedType || undefined,
      categories: selectedCategory ? [selectedCategory] : undefined,
    };
  }, [startDate, endDate, selectedType, selectedCategory]);

  // 成员 ID
  const memberIds = useMemo(() => {
    if (!isMultiMember) return undefined;
    if (selectedMemberId) return [selectedMemberId];
    return members.map((m) => m.userId);
  }, [isMultiMember, selectedMemberId, members]);

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
  const { data: transactions = [], isLoading: isTxLoading } = useQuery({
    queryKey: transactionsQueryKey,
    queryFn: () => fetchMapTransactions({ ...filters, memberIds }),
  });

  // 获取商户汇总
  const { data: merchants = [], isLoading: isMerchantLoading } = useQuery({
    queryKey: merchantsQueryKey,
    queryFn: () => fetchMerchantSummary({ ...filters, memberIds }),
  });

  // 合并加载状态
  const mapLoading = isTxLoading || isMerchantLoading;

  // ---- 下拉选项 ----

  // 类型选项
  const typeOptions: DropdownOption[] = [
    { key: 'expense', label: '支出', icon: '📤' },
    { key: 'income', label: '收入', icon: '📥' },
  ];

  // 分类选项：使用 renderCategoryIcon 渲染自定义分类图标
  const categoryOptions: DropdownOption[] = useMemo(() => {
    const filtered = selectedType
      ? allCategories.filter((c: any) => c.type === selectedType)
      : allCategories;
    return filtered
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((c: any) => ({
        key: c.id,
        label: c.name,
        icon: renderCategoryIcon(c.icon, { size: 16 }) as React.ReactNode,
      }));
  }, [allCategories, selectedType]);

  // 成员选项
  const memberOptions: DropdownOption[] = useMemo(() => {
    return members.map((m) => ({
      key: m.userId,
      label: m.username,
      color: colorMap.get(m.userId) || '#999',
    }));
  }, [members, colorMap]);

  // 视图选项
  const viewOptions: DropdownOption[] = [
    { key: 'footprints', label: '足迹', icon: '👣' },
    { key: 'heatmap', label: '热力图', icon: '🔥' },
  ];

  // ---- 汇总统计 ----
  const totalAmount = useMemo(
    () => merchants.reduce((sum: number, m: MerchantSummary) => sum + m.total_amount, 0),
    [merchants],
  );

  // ---- 点击单个商户 → 地图定位 ----
  const handleLocateMerchant = (merchant: MerchantSummary) => {
    const handle = mapCanvasRef.current;
    if (!handle) return;
    if (merchant.longitude != null && merchant.latitude != null) {
      handle.setCenter(merchant.longitude, merchant.latitude);
    } else {
      // 兜底：尝试从 transactions 中找到对应商户的坐标
      const tx = (transactions as any[]).find((t) => t.location_name === merchant.location_name);
      if (tx?.longitude != null && tx?.latitude != null) {
        handle.setCenter(tx.longitude, tx.latitude);
      }
    }
  };

  // ---- 多选商户 → 地图视野框住 ----
  const handleMultiSelect = (selected: MerchantSummary[]) => {
    const handle = mapCanvasRef.current;
    if (!handle) return;
    const validPoints: [number, number][] = [];
    selected.forEach((m) => {
      if (m.longitude != null && m.latitude != null) {
        validPoints.push([m.longitude, m.latitude]);
      }
    });
    // 兜底：如果商户对象没有经纬度，尝试从 transactions 中查
    if (validPoints.length === 0 && selected.length > 0) {
      selected.forEach((m) => {
        const tx = (transactions as any[]).find((t) => t.location_name === m.location_name);
        if (tx?.longitude != null && tx?.latitude != null) {
          validPoints.push([tx.longitude, tx.latitude]);
        }
      });
    }
    if (validPoints.length >= 2) {
      handle.setBounds(validPoints);
    } else if (validPoints.length === 1) {
      handle.setCenter(validPoints[0][0], validPoints[0][1]);
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
            onChange={(key) => {
              if (key === 'footprints' || key === 'heatmap') {
                setViewMode(key);
              }
            }}
            placeholder="视图"
            allowClear={false}
          />

          {/* 成员筛选 */}
          {isMultiMember && (
            <DropdownSelect
              label="成员"
              options={memberOptions}
              value={selectedMemberId}
              onChange={(key) => setSelectedMemberId(key)}
              placeholder="全部成员"
            />
          )}

          {/* 年月选择器（与预算模块一致） */}
          <DropdownSelect
            label="月份"
            options={monthOptions.map((o) => ({ key: o.key, label: o.label, icon: '📅' as any }))}
            value={selectedMonth}
            onChange={(key) => key && setSelectedMonth(key)}
            placeholder="选择月份"
            allowClear={false}
            showSearch
            searchPlaceholder="搜索月份..."
          />

          {/* 类型 */}
          <DropdownSelect
            label="类型"
            options={typeOptions}
            value={selectedType}
            onChange={(key) => {
              setSelectedType(key as '' | 'income' | 'expense');
              setSelectedCategory(''); // 类型切换时清空分类
            }}
            placeholder="全部"
          />

          {/* 分类（使用 renderCategoryIcon 渲染自定义图标） */}
          <DropdownSelect
            label="分类"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(key) => setSelectedCategory(key)}
            placeholder="全部分类"
          />

          <div className="map-toolbar-spacer" />

          {/* 右侧统计 chips */}
          <div className="map-stats-inline">
            <button
              type="button"
              className="map-stat-chip map-stat-chip--clickable"
              onClick={() => setDrawerOpen(true)}
              title="点击查看商户列表"
            >
              📌 <strong>{merchants.length}</strong> 个商户
            </button>
            <span className="map-stat-chip">
              💰{' '}
              <strong>
                ¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* ==== 主体内容：地图 ==== */}
      <div className="map-content">
        <div className="map-panel active">
          <MapCanvas
            ref={mapCanvasRef}
            data={transactions}
            merchants={merchants}
            viewMode={viewMode}
            members={members}
            colorMap={colorMap}
            selectedMemberId={selectedMemberId || null}
          />
          <MemberLocationLayer bookId={bookId} mapInstance={mapCanvasRef.current?.getMap?.() || null} />
          {/* 加载进度条 */}
          {mapLoading && (
            <div className="map-loading-overlay" role="status" aria-label="加载中">
              <div className="map-loading-spinner" />
              <div className="map-loading-text">正在加载数据…</div>
              <div className="map-loading-bar">
                <div className="map-loading-bar-inner" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==== 右侧商户抽屉 ==== */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="商户足迹"
        width={440}
      >
        <MerchantDrawer
          merchants={merchants}
          loading={mapLoading}
          onLocateMerchant={handleLocateMerchant}
          onMultiSelect={handleMultiSelect}
        />
      </Drawer>
    </div>
  );
};

export default MapPage;
