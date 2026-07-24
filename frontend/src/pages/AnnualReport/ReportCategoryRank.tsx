import React, { useMemo } from 'react';
import { renderCategoryIcon } from '../../utils/renderCategoryIcon';
import { getChartPalette } from '../../utils/themeColors'
import { formatMoney } from '../../utils/budget'

interface CategoryItem {
  category_name: string;
  category_icon: string;
  category_type: string;
  amount: number;
  percentage: number;
}

interface ReportCategoryRankProps {
  data: CategoryItem[];
}

export const ReportCategoryRank: React.FC<ReportCategoryRankProps> = ({ data }) => {
  const colors = useMemo(() => getChartPalette(), []);
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fg)',
          marginBottom: '16px',
        }}
      >
        🏷️ 支出分类 TOP5
      </h2>
      <div
        style={{
          background: 'var(--srf)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--bd)',
        }}
      >
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.category_name} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: colors[index % colors.length] + '20' }}
              >
                {renderCategoryIcon(item.category_icon, { size: 18 })}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg)' }}>
                    {item.category_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>
                      {formatMoney(item.amount, { compact: true })}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--fg3)' }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bdL)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: colors[index % colors.length],
                      boxShadow: `0 0 8px ${colors[index % colors.length]}40`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportCategoryRank;