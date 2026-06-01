import React from 'react';
import type { BudgetAlert } from '../../types/budget';

export interface BudgetAlertBannerProps {
  alerts: BudgetAlert[];
  monthKey: string; // "2026-06"
  onDismiss: () => void;
}

/** 格式化月份显示，如 "2026-06" → "2026年6月" */
const formatMonthLabel = (monthKey: string): string => {
  const parts = monthKey.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    return `${year}年${monthNum}月`;
  }
  return monthKey;
};

/** 严重超支（progress >= 100）视为 danger，否则为 warning */
const hasDangerAlert = (alerts: BudgetAlert[]): boolean => {
  return alerts.some((a) => a.progress >= 100);
};

export const BudgetAlertBanner: React.FC<BudgetAlertBannerProps> = ({
  alerts,
  monthKey,
  onDismiss,
}) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const isDanger = hasDangerAlert(alerts);
  const monthLabel = formatMonthLabel(monthKey);

  // 构建预警文本
  const alertTexts = alerts.map((a) => `${a.category_icon}${a.category_name}已用${a.progress}%`);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg mb-4"
      style={{
        background: isDanger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
        border: `1px solid ${isDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
      }}
      role="alert"
      aria-live="polite"
    >
      {/* 图标区域 */}
      <span className="text-lg leading-none shrink-0 mt-0.5" aria-hidden="true">
        {isDanger ? '🚨' : '⚠️'}
      </span>

      {/* 文本区域 */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold mb-1"
          style={{ color: isDanger ? 'var(--danger)' : 'var(--warning)' }}
        >
          {isDanger ? '预算超支' : '预算预警'} — {monthLabel}
        </div>
        <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
          预算预警：{alertTexts.join('，')}
        </div>
      </div>

      {/* 关闭按钮 */}
      <button
        type="button"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-sm leading-none transition-opacity hover:opacity-70"
        style={{
          color: 'var(--muted)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={onDismiss}
        aria-label="关闭预警"
      >
        ✕
      </button>
    </div>
  );
};

export default BudgetAlertBanner;
