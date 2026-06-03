import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  marginBottom?: string;
  className?: string;
}

/**
 * 骨架屏占位组件 — 全局复用
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  marginBottom = '0',
  className = '',
}) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius,
      marginBottom,
      background:
        'linear-gradient(90deg, var(--bg) 25%, var(--border) 50%, var(--bg) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
    }}
  />
);

/**
 * 交易列表骨架屏 — 模拟列表项
 */
export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Skeleton width="40px" height="40px" borderRadius="8px" />
        <div style={{ flex: 1, marginLeft: '16px', marginRight: '12px' }}>
          <Skeleton width="55%" height="15px" marginBottom="8px" />
          <Skeleton width="75%" height="13px" />
        </div>
        <Skeleton width="72px" height="16px" />
      </div>
    ))}
  </div>
);

/**
 * 图表骨架屏
 */
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '240px' }) => (
  <Skeleton width="100%" height={height} borderRadius="12px" />
);
