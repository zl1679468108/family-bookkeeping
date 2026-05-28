import React from 'react';
import { CategoryBreakdownItem } from '../../types/statistics';
import { useCategoryLookup } from '../../hooks/useCategories';
import { formatAmount } from '../../utils/common';
import './index.scss';

interface CategoryRankingProps {
  data: CategoryBreakdownItem[];
  type: 'income' | 'expense';
  totalAmount: number;
}

export const CategoryRanking: React.FC<CategoryRankingProps> = ({
  data,
  type: _type,
  totalAmount,
}) => {
  const { getCategoryName, getCategoryIcon } = useCategoryLookup();

  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  if (sortedData.length === 0) {
    return (
      <div className="category-ranking">
        <div className="category-ranking__empty">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="category-ranking">
      <table className="category-ranking__table">
        <thead>
          <tr className="category-ranking__header-row">
            <th className="category-ranking__cell category-ranking__cell--rank">#</th>
            <th className="category-ranking__cell category-ranking__cell--category">分类</th>
            <th className="category-ranking__cell category-ranking__cell--amount">金额</th>
            <th className="category-ranking__cell category-ranking__cell--percent">占比</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => {
            const displayLabel = `${getCategoryIcon(item.category)} ${getCategoryName(item.category)}`;
            const displayPercentage =
              totalAmount > 0
                ? ((item.amount / totalAmount) * 100).toFixed(1)
                : '0.0';

            return (
              <tr key={item.category} className="category-ranking__row">
                <td className="category-ranking__cell category-ranking__cell--rank">
                  {index + 1}
                </td>
                <td className="category-ranking__cell category-ranking__cell--category">
                  {displayLabel}
                </td>
                <td className="category-ranking__cell category-ranking__cell--amount">
                  {formatAmount(item.amount)}
                </td>
                <td className="category-ranking__cell category-ranking__cell--percent">
                  {displayPercentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
