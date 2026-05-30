/**
 * BudgetBar — Budget progress bar component.
 * Shows spent/total ratio with color-coded progress.
 */

import React from 'react';

interface BudgetBarProps {
  spent: number;
  total: number;
}

const BudgetBar: React.FC<BudgetBarProps> = ({ spent, total }) => {
  const progress = Math.min((spent / total) * 100, 100);
  const isOverBudget = spent > total;
  const isWarn = progress >= 80 && !isOverBudget;

  const barColor = isOverBudget ? 'bg-danger' : isWarn ? 'bg-yellow-400' : 'bg-white/40';
  const textColor = isOverBudget ? 'text-danger' : 'text-white/80';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={textColor}>
          预算 {isOverBudget ? '已超支' : `已用 ${progress.toFixed(0)}%`}
        </span>
        <span className={textColor}>
          ¥{spent.toFixed(0)} / ¥{total.toFixed(0)}
        </span>
      </div>
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default BudgetBar;
