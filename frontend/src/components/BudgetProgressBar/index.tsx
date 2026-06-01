import React from 'react';

export interface BudgetProgressBarProps {
  categoryName: string;
  categoryIcon: string;
  spent: number;
  budget: number;
  progress: number;
  onClick?: () => void;
  clickable?: boolean;
}

/** 根据进度值返回进度条颜色 */
const getProgressColor = (progress: number): string => {
  if (progress > 100) return '#991b1b'; // 深红 — 严重超支
  if (progress >= 90) return '#ef4444'; // 红 — 超支
  if (progress >= 70) return '#f59e0b'; // 黄 — 预警
  return '#22c55e'; // 绿 — 安全
};

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  categoryName,
  categoryIcon,
  spent,
  budget,
  progress,
  onClick,
  clickable = false,
}) => {
  const progressColor = getProgressColor(progress);
  const displayProgress = Math.min(progress, 100);

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="flex items-center gap-3 py-2 px-1 rounded-md transition-colors"
      style={{
        cursor: clickable ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${categoryIcon} ${categoryName} 预算进度 ${progress}%` : undefined}
    >
      {/* 左侧：图标 + 名称 */}
      <div className="flex items-center gap-2 min-w-0 w-28 shrink-0">
        <span className="text-base leading-none shrink-0">{categoryIcon}</span>
        <span className="text-sm text-[var(--fg)] truncate">{categoryName}</span>
      </div>

      {/* 中间：进度条 */}
      <div className="flex-1 min-w-0">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--border)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${displayProgress}%`,
              background: progressColor,
            }}
          />
        </div>
      </div>

      {/* 右侧：spent / budget */}
      <div className="flex items-center gap-1 shrink-0 text-xs whitespace-nowrap">
        <span style={{ color: 'var(--fg)', fontWeight: 500 }}>
          ¥{spent.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
        </span>
        <span style={{ color: 'var(--muted)' }}>/</span>
        <span style={{ color: 'var(--muted)' }}>
          ¥{budget.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
};

export default BudgetProgressBar;
