/**
 * CategoryGrid — Grid of category icons for selection during transaction creation.
 * Shows 4-column grid with circular icons + name labels.
 * Selected item gets primary border + light background.
 */

import React from 'react';
import type { Category } from '../types';
import { getCategoryBg } from '../utils/categoryColors';

interface CategoryGridProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  if (categories.length === 0) {
    return (
      <p className="text-text-secondary text-sm text-center py-6">
        暂无分类数据
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {categories.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all active:scale-95 touch-target ${
              isSelected
                ? 'bg-primary-bg ring-2 ring-primary scale-105'
                : `${getCategoryBg(cat.name)} active:opacity-80`
            }`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span
              className={`text-xs truncate w-full text-center ${
                isSelected ? 'text-primary font-medium' : 'text-text-secondary'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryGrid;
