import React, { useMemo } from 'react';
import { getChartPalette } from '../../utils/themeColors'
import { formatMoney } from '../../utils/budget'

interface BookItem {
  book_id: string;
  book_name: string;
  amount: number;
  percentage: number;
}

interface Props {
  data: BookItem[];
}

const ReportBookBreakdown: React.FC<Props> = ({ data }) => {
  const colors = useMemo(() => getChartPalette(), []);

  if (!data || data.length <= 1) return null;

  return (
    <div className="mb-6 px-4">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--fg)' }}>📊 账本视角</h2>
      <div className="space-y-4">
        {data.map((book, i) => (
          <div key={book.book_id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm" style={{ color: 'var(--fg2)' }}>{book.book_name}</span>
              <span className="text-sm" style={{ color: 'var(--fg3)' }}>
                {formatMoney(book.amount, { compact: true })} ({book.percentage}%)
              </span>
            </div>
            <div className="w-full rounded-full h-2.5" style={{ background: 'var(--bdL)' }}>
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.max(book.percentage, 2)}%`,
                  backgroundColor: colors[i % colors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportBookBreakdown;
