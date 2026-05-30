/**
 * FilterBar — Filter controls for the transactions list page.
 * Month selector + category dropdown + search input.
 */

import React, { useState } from 'react';

interface FilterBarProps {
  onMonthChange: (year: number, month: number) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onSearch: (query: string) => void;
  onTypeChange?: (type: 'all' | 'income' | 'expense') => void;
  categoryOptions: { value: string; label: string }[];
  year: number;
  month: number;
  activeType?: 'all' | 'income' | 'expense';
}

const FilterBar: React.FC<FilterBarProps> = ({
  onMonthChange,
  onCategoryChange,
  onSearch,
  onTypeChange,
  categoryOptions,
  year,
  month,
  activeType = 'all',
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);

  const handleSearch = () => {
    onSearch(searchText);
    setSearchOpen(false);
  };

  const handleClearSearch = () => {
    setSearchText('');
    onSearch('');
    setSearchOpen(false);
  };

  const goPrevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const goNextMonth = () => {
    const now = new Date();
    if (year === now.getFullYear() && month >= now.getMonth() + 1) return;
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100">
      {/* Month + Search row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={goPrevMonth} className="touch-target text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="text-sm font-semibold">
            {year}年{month}月
          </span>
          <button
            onClick={goNextMonth}
            disabled={year === new Date().getFullYear() && month >= new Date().getMonth() + 1}
            className="touch-target text-text-secondary disabled:text-gray-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryOpen(!categoryOpen)}
            className="touch-target px-3 py-1.5 rounded-lg text-xs bg-gray-50 text-text-secondary active:bg-gray-100"
          >
            分类
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="touch-target px-3 py-1.5 rounded-lg text-xs bg-gray-50 text-text-secondary active:bg-gray-100"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Search input (expandable) */}
      {searchOpen && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索备注或分类..."
            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm border-none outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg active:bg-primary-light"
          >
            搜索
          </button>
          <button
            onClick={handleClearSearch}
            className="px-2 py-2 text-text-secondary text-sm"
          >
            取消
          </button>
        </div>
      )}

      {/* Type filter tabs */}
      {onTypeChange && (
        <div className="flex gap-1 mb-3 bg-gray-50 rounded-lg p-0.5">
          {([
            { key: 'all', label: '全部', bg: '' },
            { key: 'expense', label: '支出', bg: 'data-[active=true]:bg-[#FFF0E8] data-[active=true]:text-[#D85A30]' },
            { key: 'income', label: '收入', bg: 'data-[active=true]:bg-[#E8FFE8] data-[active=true]:text-[#1D9E75]' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => onTypeChange(t.key)}
              data-active={activeType === t.key}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${
                activeType === t.key
                  ? t.key === 'expense' ? 'bg-[#FFF0E8] text-[#D85A30]' :
                    t.key === 'income' ? 'bg-[#E8FFE8] text-[#1D9E75]' :
                    'bg-white text-text shadow-sm'
                  : 'text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Category dropdown */}
      {categoryOpen && (
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => {
              onCategoryChange(null);
              setCategoryOpen(false);
            }}
            className="px-3 py-1.5 rounded-full text-xs bg-primary text-white"
          >
            全部
          </button>
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onCategoryChange(opt.value);
                setCategoryOpen(false);
              }}
              className="px-3 py-1.5 rounded-full text-xs bg-gray-50 text-text-secondary active:bg-primary-bg active:text-primary"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
