import React, { useState, useMemo, useEffect } from 'react';
import type { MerchantSummary } from '@family-bookkeeping/shared-types'
import { SearchInput } from '../../../../components/ui/Input';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Pagination } from '../../../../components/ui/Pagination';
import './index.scss';
import { formatAmount } from '../../../../utils/common';

interface MerchantDrawerProps {
  merchants: MerchantSummary[];
  loading: boolean;
  /** 点击单个商户时，将地图定位到该位置 */
  onLocateMerchant?: (merchant: MerchantSummary) => void;
  /** 多选后，将地图视野框住这些位置 */
  onMultiSelect?: (selected: MerchantSummary[]) => void;
}

const PAGE_SIZE = 10;

export const MerchantDrawer: React.FC<MerchantDrawerProps> = ({
  merchants,
  loading,
  onLocateMerchant,
  onMultiSelect,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // 搜索变化时重置页码
  useEffect(() => {
    setPage(1);
  }, [search]);

  // 搜索过滤（模糊匹配商户名称 / 地址）
  const filtered = useMemo(() => {
    if (!search.trim()) return merchants;
    const keyword = search.trim().toLowerCase();
    return merchants.filter((m) => m.location_name.toLowerCase().includes(keyword));
  }, [merchants, search]);

  // 分页切片
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 汇总统计
  const expenseTotal = useMemo(
    () => merchants.reduce((sum, m) => sum + m.expense_total, 0),
    [merchants]
  );
  const incomeTotal = useMemo(
    () => merchants.reduce((sum, m) => sum + m.income_total, 0),
    [merchants]
  );

  // 获取商户唯一 key
  const getKey = (m: MerchantSummary) => m.poi_id || m.location_name;

  // 选中数量
  const selectedCount = useMemo(
    () => filtered.filter((m) => selectedKeys.has(getKey(m))).length,
    [filtered, selectedKeys]
  );

  // 当前页是否全选
  const allVisibleSelected =
    pageItems.length > 0 && pageItems.every((m) => selectedKeys.has(getKey(m)));

  const handleToggleSelect = (m: MerchantSummary) => {
    const key = getKey(m);
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedKeys(next);
    const selectedMerchants = merchants.filter((f) => next.has(getKey(f)));
    onMultiSelect?.(selectedMerchants);
  };

  const handleClearSelection = () => {
    setSelectedKeys(new Set());
    onMultiSelect?.([]);
  };

  const handleSelectAllVisible = () => {
    const visibleKeys = pageItems.map(getKey);
    const allSelected = visibleKeys.every((k) => selectedKeys.has(k));
    const next = new Set(selectedKeys);
    if (allSelected) {
      visibleKeys.forEach((k) => next.delete(k));
    } else {
      visibleKeys.forEach((k) => next.add(k));
    }
    setSelectedKeys(next);
    const selectedMerchants = merchants.filter((f) => next.has(getKey(f)));
    onMultiSelect?.(selectedMerchants);
  };

  return (
    <div className="merchant-drawer">
      {/* 搜索框 */}
      <div className="merchant-drawer__toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="搜索商户名称 / 地址"
          allowClear
        />
        <div className="merchant-drawer__summary">
          <span className="merchant-drawer__summary-item">
            共 <strong>{merchants.length}</strong> 个商户
          </span>
          {expenseTotal > 0 && (
            <span className="merchant-drawer__summary-item expense">
              支出 <strong>{formatAmount(expenseTotal)}</strong>
            </span>
          )}
          {incomeTotal > 0 && (
            <span className="merchant-drawer__summary-item income">
              收入 <strong>{formatAmount(incomeTotal)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 多选工具栏 */}
      {filtered.length > 0 && (
        <div className="merchant-drawer__multiselect">
          <div className="merchant-drawer__checkbox-label" onClick={handleSelectAllVisible}>
            <span className="merchant-drawer__checkbox">
              <input type="checkbox" checked={allVisibleSelected} readOnly />
              <span className="merchant-drawer__checkbox-custom" />
            </span>
            <span className="merchant-drawer__checkbox-text">
              当前页全选{selectedCount > 0 && <span className="merchant-drawer__checkbox-count">已选 {selectedCount}</span>}
            </span>
            {selectedCount > 0 && (
              <button
                type="button"
                className="merchant-drawer__clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSelection();
                }}
              >
                清除
              </button>
            )}
          </div>
        </div>
      )}

      {/* 列表主体 */}
      <div className="merchant-drawer__list">
        {loading ? (
          <div className="merchant-drawer__skeleton-group">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="merchant-drawer__skeleton-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Skeleton width="20px" height="20px" borderRadius="4px" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height="14px" marginBottom="6px" />
                    <Skeleton width="40%" height="12px" />
                  </div>
                  <Skeleton width="80px" height="14px" />
                </div>
                <div style={{ display: 'flex', marginTop: '8px', gap: '8px' }}>
                  <Skeleton width="45%" height="28px" borderRadius="6px" />
                  <Skeleton width="45%" height="28px" borderRadius="6px" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="compact"
            title="暂无商户数据"
            description={search ? '未找到匹配的商户，试试其他关键词' : '记一笔时添加位置信息，系统会自动按商户聚合'}
          />
        ) : (
          pageItems.map((m, idx) => {
            const key = getKey(m);
            const isChecked = selectedKeys.has(key);
            const rank = (currentPage - 1) * PAGE_SIZE + idx + 1;
            return (
              <div
                key={key}
                className={`merchant-drawer__item ${isChecked ? 'is-selected' : ''}`}
                onClick={() => onLocateMerchant?.(m)}
              >
                {/* 多选 checkbox */}
                <span
                  className="merchant-drawer__item-checkbox"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSelect(m);
                  }}
                >
                  <input type="checkbox" checked={isChecked} readOnly />
                  <span className="merchant-drawer__checkbox-custom--sm" />
                </span>

                {/* 排名 */}
                <span className="merchant-drawer__rank">#{rank}</span>

                <div className="merchant-drawer__item-info">
                  {/* 商户名称 */}
                  <div className="merchant-drawer__item-name">🏪 {m.location_name}</div>

                  {/* 收支块 */}
                  <div className="merchant-drawer__item-stats">
                    {m.expense_count > 0 && (
                      <div className="merchant-drawer__stat-item expense">
                        <span className="merchant-drawer__stat-label">支出</span>
                        <span className="merchant-drawer__stat-amount">
                          {formatAmount(m.expense_total)}
                        </span>
                        <span className="merchant-drawer__stat-count">{m.expense_count} 次</span>
                      </div>
                    )}
                    {m.income_count > 0 && (
                      <div className="merchant-drawer__stat-item income">
                        <span className="merchant-drawer__stat-label">收入</span>
                        <span className="merchant-drawer__stat-amount">
                          {formatAmount(m.income_total)}
                        </span>
                        <span className="merchant-drawer__stat-count">{m.income_count} 次</span>
                      </div>
                    )}
                  </div>

                  <div className="merchant-drawer__item-date">最近交易: {m.last_transaction_date}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页 */}
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50]}
        showSizeChanger={filtered.length > PAGE_SIZE}
        align="center"
      />
    </div>
  );
};

export default MerchantDrawer;
