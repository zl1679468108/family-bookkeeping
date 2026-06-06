import React, { useMemo } from 'react';
import { useMemberComparison } from '../../hooks/useMemberComparison';
import type { MemberComparisonItem, MemberCategoryBreakdown } from '../../types/memberComparison';
import { Skeleton } from '../../components/ui/Skeleton';
import './MemberComparison.scss';

interface MemberComparisonProps {
  bookId: string;
  monthFrom: string; // "2026-05"
  monthTo: string;   // "2026-07"
}

/** 预定义色板，用于区分不同成员 */
const MEMBER_COLORS: string[] = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6',
];

/** 将 YYYY-MM 转换为友好显示 */
const formatMonth = (ym: string): string => {
  const parts = ym.split('-');
  if (parts.length === 2) {
    return `${parseInt(parts[1], 10)}月`;
  }
  return ym;
};

/** 生成 monthFrom ~ monthTo 之间的所有月份 */
const generateMonthRange = (from: string, to: string): string[] => {
  const months: string[] = [];
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
};

// ============================================================
// Section A: 环形图（纯 SVG）
// ============================================================

const DonutChart: React.FC<{ data: MemberComparisonItem[] }> = ({ data }) => {
  const total = useMemo(() => data.reduce((sum, m) => sum + m.total_expense, 0), [data]);

  if (data.length === 0) {
    return <div className="mc-empty">暂无成员数据</div>;
  }

  const radius = 60;
  const strokeWidth = 16;
  const viewSize = (radius + strokeWidth) * 2;
  const center = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const segments = data.map((member, i) => {
    const pct = total > 0 ? member.total_expense / total : 0;
    const length = pct * circumference;
    const offset = cumulative;
    cumulative += length;
    return {
      member,
      pct,
      length: Math.max(length, 0.5), // 最小可见弧长
      offset,
      color: MEMBER_COLORS[i % MEMBER_COLORS.length],
    };
  });

  return (
    <div className="mc-donut-wrap">
      <svg
        viewBox={`0 0 ${viewSize} ${center * 2}`}
        className="mc-donut-svg"
      >
        {segments.map((seg) => (
          <circle
            key={seg.member.user_id}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={-seg.offset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ))}
        {/* 中心文字 */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="mc-donut-label"
        >
          总支出
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          className="mc-donut-amount"
        >
          ¥{total.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
        </text>
      </svg>

      {/* 图例 */}
      <div className="mc-donut-legend">
        {segments.map((seg) => (
          <div key={seg.member.user_id} className="mc-donut-legend-item">
            <span
              className="mc-donut-legend-dot"
              style={{ backgroundColor: seg.color }}
            />
            <span className="mc-donut-legend-name">{seg.member.user_name}</span>
            <span className="mc-donut-legend-value">
              ¥{seg.member.total_expense.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
            </span>
            <span className="mc-donut-legend-pct">
              {(seg.pct * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Section B: 分类柱状图（HTML Table 热力图）
// ============================================================

const CategoryTable: React.FC<{ data: MemberComparisonItem[] }> = ({ data }) => {
  // 聚合所有分类，取 Top 5
  const topCategories = useMemo(() => {
    const catMap = new Map<string, { icon: string; total: number }>();
    data.forEach((member) => {
      member.categories.forEach((cat) => {
        const existing = catMap.get(cat.category_name);
        if (existing) {
          existing.total += cat.amount;
        } else {
          catMap.set(cat.category_name, { icon: cat.category_icon, total: cat.amount });
        }
      });
    });
    return Array.from(catMap.entries())
      .map(([name, info]) => ({ name, icon: info.icon, total: info.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [data]);

  if (data.length === 0 || topCategories.length === 0) {
    return <div className="mc-empty">暂无分类数据</div>;
  }

  // 构建快速查找: member -> category -> amount
  const memberCatMap = new Map<string, Map<string, number>>();
  data.forEach((member) => {
    const inner = new Map<string, number>();
    member.categories.forEach((cat) => {
      inner.set(cat.category_name, cat.amount);
    });
    memberCatMap.set(member.user_id, inner);
  });

  // 计算每列最大值用于热力背景
  const colMax = topCategories.map((cat) => {
    let max = 0;
    data.forEach((member) => {
      const amt = memberCatMap.get(member.user_id)?.get(cat.name) ?? 0;
      if (amt > max) max = amt;
    });
    return max;
  });

  const heatAlpha = (amount: number, max: number): number => {
    if (max === 0) return 0;
    return Math.max(0.05, amount / max);
  };

  return (
    <table className="mc-cat-table">
      <thead>
        <tr>
          <th className="mc-cat-th-name">成员</th>
          {topCategories.map((cat) => (
            <th key={cat.name} className="mc-cat-th">
              {cat.icon} {cat.name}
            </th>
          ))}
          <th className="mc-cat-th">合计</th>
        </tr>
      </thead>
      <tbody>
        {data.map((member) => {
          const catMap = memberCatMap.get(member.user_id) ?? new Map();
          return (
            <tr key={member.user_id}>
              <td className="mc-cat-td-name">{member.user_name}</td>
              {topCategories.map((cat, ci) => {
                const amt = catMap.get(cat.name) ?? 0;
                const alpha = heatAlpha(amt, colMax[ci]);
                return (
                  <td
                    key={cat.name}
                    className="mc-cat-td"
                    style={{
                      backgroundColor: amt > 0
                        ? `rgba(99, 102, 241, ${(alpha * 0.55).toFixed(2)})`
                        : 'transparent',
                      color: alpha > 0.6 ? '#fff' : 'var(--fg)',
                    }}
                  >
                    {amt > 0
                      ? `¥${amt.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`
                      : '-'}
                  </td>
                );
              })}
              <td className="mc-cat-td mc-cat-td-total">
                ¥{member.total_expense.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// ============================================================
// Section C: 月度矩阵（暂无月度细分数据）
// ============================================================

const MonthlyMatrix: React.FC<{
  data: MemberComparisonItem[];
  monthFrom: string;
  monthTo: string;
}> = ({ data, monthFrom, monthTo }) => {
  const months = useMemo(() => generateMonthRange(monthFrom, monthTo), [monthFrom, monthTo]);

  return (
    <div className="mc-matrix-wrap">
      <table className="mc-matrix-table">
        <thead>
          <tr>
            <th className="mc-matrix-th-name">成员</th>
            {months.map((m) => (
              <th key={m} className="mc-matrix-th">{formatMonth(m)}</th>
            ))}
            <th className="mc-matrix-th">合计</th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr key={member.user_id}>
              <td className="mc-matrix-td-name">{member.user_name}</td>
              {months.map((m) => (
                <td key={m} className="mc-matrix-td-empty">
                  -
                </td>
              ))}
              <td className="mc-matrix-td-total">
                ¥{member.total_expense.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mc-matrix-hint">暂无月度细分数据</p>
    </div>
  );
};

// ============================================================
// MemberComparison 主组件
// ============================================================

export const MemberComparison: React.FC<MemberComparisonProps> = ({
  bookId,
  monthFrom,
  monthTo,
}) => {
  const { data = [], isLoading, error } = useMemberComparison(
    bookId ? { book_id: bookId, month_from: monthFrom, month_to: monthTo } : null,
  );

  if (!bookId) {
    return <div className="mc-empty">请先选择一个账本</div>;
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Skeleton width="100%" height="200px" borderRadius="12px" marginBottom="20px" />
        {[1,2,3,4].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border, #f0f0f0)' }}>
            <Skeleton width="32px" height="32px" borderRadius="50%" />
            <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
              <Skeleton width="55%" height="14px" marginBottom="6px" />
              <Skeleton width="40%" height="12px" />
            </div>
            <Skeleton width="72px" height="14px" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mc-empty">
        加载失败：{error instanceof Error ? error.message : '未知错误'}
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="mc-empty">暂无成员消费数据</div>;
  }

  const periodLabel = `${monthFrom} ~ ${monthTo}`;

  return (
    <div className="mc-container">
      {/* Section A: 环形图 */}
      <div className="mc-section">
        <h3 className="mc-section-title">成员支出分布 · {periodLabel}</h3>
        <DonutChart data={data} />
      </div>

      {/* Section B: 分类柱状图 */}
      <div className="mc-section">
        <h3 className="mc-section-title">分类对比（Top 5）</h3>
        <div className="mc-table-scroll">
          <CategoryTable data={data} />
        </div>
      </div>

      {/* Section C: 月度矩阵 */}
      <div className="mc-section">
        <h3 className="mc-section-title">月度明细 · {periodLabel}</h3>
        <div className="mc-table-scroll">
          <MonthlyMatrix data={data} monthFrom={monthFrom} monthTo={monthTo} />
        </div>
      </div>
    </div>
  );
};

export default MemberComparison;
