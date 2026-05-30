/**
 * SummaryCard — Monthly overview card with large expense amount,
 * income/balance subtitles, and budget progress bar.
 */

import React from 'react';
import BudgetBar from './BudgetBar';

interface SummaryCardProps {
  totalExpense: number;
  totalIncome: number;
  balance: number;
  budgetTotal?: number;
  budgetSpent?: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  totalExpense,
  totalIncome,
  balance,
  budgetTotal,
  budgetSpent,
}) => {
  const formatAmount = (val: number): string => {
    if (Math.abs(val) >= 10000) {
      return (val / 10000).toFixed(1) + '万';
    }
    return val.toFixed(2);
  };

  return (
    <div className="bg-primary rounded-2xl p-5 text-white shadow-sm">
      {/* Expense — large display */}
      <p className="text-sm opacity-80 mb-1">本月支出</p>
      <p className="text-3xl font-bold mb-3">
        ¥{formatAmount(totalExpense)}
      </p>

      {/* Income & Balance row */}
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs opacity-70">收入</p>
          <p className="text-base font-semibold">¥{formatAmount(totalIncome)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-70">结余</p>
          <p className="text-base font-semibold">¥{formatAmount(balance)}</p>
        </div>
      </div>

      {/* Budget progress */}
      {budgetTotal !== undefined && budgetSpent !== undefined && budgetTotal > 0 && (
        <BudgetBar spent={budgetSpent} total={budgetTotal} />
      )}
    </div>
  );
};

export default SummaryCard;
