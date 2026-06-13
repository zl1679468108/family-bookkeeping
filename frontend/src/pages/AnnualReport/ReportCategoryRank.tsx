import React from 'react';

interface CategoryItem {
  category_name: string;
  category_icon: string;
  amount: number;
  percentage: number;
}

interface ReportCategoryRankProps {
  data: CategoryItem[];
}

const colors = ['#FF7043', '#42A5F5', '#66BB6A', '#AB47BC', '#FFA726'];

export const ReportCategoryRank: React.FC<ReportCategoryRankProps> = ({ data }) => {
  const formatAmount = (n: number) => {
    if (n >= 10000) {
      return '¥' + (n / 10000).toFixed(1) + 'w';
    }
    return '¥' + n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

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
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border)',
        }}
      >
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={item.category_name} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: colors[index % colors.length] + '20' }}
              >
                <span>{item.category_icon || '📦'}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--fg)' }}>
                    {item.category_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>
                      {formatAmount(item.amount)}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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