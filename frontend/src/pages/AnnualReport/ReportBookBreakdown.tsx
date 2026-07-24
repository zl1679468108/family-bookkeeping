import React from 'react';
import { getChartPalette, getThemeColors } from '../../utils/themeColors'

interface BookItem {
  book_id: string;
  book_name: string;
  amount: number;
  percentage: number;
}

interface Props {
  data: BookItem[];
}

const COLORS = getChartPalette();

const ReportBookBreakdown: React.FC<Props> = ({ data }) => {
  if (!data || data.length <= 1) return null;

  return (
    <div className="mb-6 px-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">📊 账本视角</h2>
      <div className="space-y-4">
        {data.map((book, i) => (
          <div key={book.book_id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700">{book.book_name}</span>
              <span className="text-sm text-gray-500">
                ¥{book.amount.toFixed(0)} ({book.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.max(book.percentage, 2)}%`,
                  backgroundColor: COLORS[i % COLORS.length],
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
