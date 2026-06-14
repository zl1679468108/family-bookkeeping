import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  marginBottom?: string;
  className?: string;
}

/**
 * 基础骨架屏占位组件 — 全局复用
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
 * 头像骨架屏
 */
export const AvatarSkeleton: React.FC<{ size?: string }> = ({ size = '40px' }) => (
  <Skeleton width={size} height={size} borderRadius="50%" />
);

/**
 * 按钮骨架屏
 */
export const ButtonSkeleton: React.FC<{ width?: string; height?: string }> = ({
  width = '80px',
  height = '32px',
}) => (
  <Skeleton width={width} height={height} borderRadius="8px" />
);

/**
 * 输入框骨架屏
 */
export const InputSkeleton: React.FC<{ width?: string }> = ({ width = '100%' }) => (
  <Skeleton width={width} height="40px" borderRadius="8px" />
);

/**
 * 文本行骨架屏
 */
export const TextLineSkeleton: React.FC<{
  width?: string;
  height?: string;
  marginBottom?: string;
}> = ({ width = '100%', height = '14px', marginBottom = '8px' }) => (
  <Skeleton width={width} height={height} borderRadius="4px" marginBottom={marginBottom} />
);

/**
 * 文本段落骨架屏
 */
export const TextParagraphSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div>
    {Array.from({ length: lines }, (_, i) => (
      <TextLineSkeleton
        key={i}
        width={i === 0 ? '100%' : i === 1 ? '90%' : '75%'}
        marginBottom={i === lines - 1 ? '0' : '8px'}
      />
    ))}
  </div>
);

/**
 * 卡片网格骨架屏 — 用于账本、模板、分类等页面
 */
export const CardGridSkeleton: React.FC<{
  count?: number;
  columns?: number;
}> = ({ count = 6, columns = 6 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '12px',
    }}
  >
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        style={{
          padding: '14px',
          background: 'var(--srf)',
          border: '1px solid var(--bd)',
          borderRadius: 'var(--rm)',
          minHeight: '88px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width="16px" height="16px" borderRadius="4px" />
          <Skeleton width="55%" height="14px" borderRadius="4px" />
        </div>
        <Skeleton width="70%" height="12px" borderRadius="4px" />
        <Skeleton width="50%" height="11px" borderRadius="4px" />
      </div>
    ))}
  </div>
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
          borderBottom: '1px solid var(--bd)',
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

/**
 * 统计卡片骨架屏 — 数据看板
 */
export const StatCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="stat-grid">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="stat-card">
        <Skeleton width="45%" height="12px" borderRadius="6px" marginBottom="8px" />
        <Skeleton width="70%" height="26px" borderRadius="8px" marginBottom="8px" />
        <Skeleton width="35%" height="12px" borderRadius="6px" />
      </div>
    ))}
  </div>
);

/**
 * 表格行骨架屏 — 用户/交易列表
 */
export const TableRowsSkeleton: React.FC<{
  columns?: number;
  rows?: number;
}> = ({ columns = 8, rows = 10 }) => (
  <table className="data-table" style={{ minWidth: '1200px' }}>
    <thead>
      <tr>
        {Array.from({ length: columns }, (_, i) => (
          <th key={i}>
            <Skeleton width="60%" height="10px" borderRadius="4px" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }, (_, rowIdx) => (
        <tr key={rowIdx}>
          {Array.from({ length: columns }, (_, colIdx) => (
            <td key={colIdx}>
              <Skeleton
                width={colIdx === 0 ? '50%' : colIdx === columns - 1 ? '80%' : '70%'}
                height="14px"
                borderRadius="4px"
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/**
 * 页面标题区域骨架屏
 */
export const PageHeaderSkeleton: React.FC = () => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
      <div>
        <TextLineSkeleton width="25%" height="20px" marginBottom="6px" />
        <TextLineSkeleton width="40%" height="14px" />
      </div>
      <ButtonSkeleton width="100px" height="36px" />
    </div>
    <InputSkeleton />
  </div>
);

/**
 * 通用列表项骨架屏
 */
export const ListItemSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--bd)',
          gap: '12px',
        }}
      >
        <Skeleton width="32px" height="32px" borderRadius="8px" />
        <div style={{ flex: 1 }}>
          <TextLineSkeleton width="60%" height="14px" marginBottom="4px" />
          <TextLineSkeleton width="80%" height="12px" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * 模态框骨架屏
 */
export const ModalSkeleton: React.FC = () => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <Skeleton width="25%" height="18px" borderRadius="4px" />
        <Skeleton width="24px" height="24px" borderRadius="50%" />
      </div>
      <div className="modal-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <TextLineSkeleton width="20%" height="13px" marginBottom="8px" />
            <InputSkeleton />
          </div>
          <div>
            <TextLineSkeleton width="20%" height="13px" marginBottom="8px" />
            <InputSkeleton />
          </div>
          <div>
            <TextLineSkeleton width="20%" height="13px" marginBottom="12px" />
            <CardGridSkeleton count={5} columns={5} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <ButtonSkeleton width="80px" height="36px" />
        <ButtonSkeleton width="100px" height="36px" />
      </div>
    </div>
  </div>
);

/**
 * 侧边栏骨架屏
 */
export const SidebarSkeleton: React.FC = () => (
  <aside className="app-sidebar">
    <div className="sidebar-logo">
      <Skeleton width="32px" height="32px" borderRadius="8px" />
      <Skeleton width="40px" height="14px" borderRadius="4px" />
    </div>
    <nav className="sidebar-nav">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
          }}
        >
          <Skeleton width="16px" height="16px" borderRadius="4px" />
          <Skeleton width="60px" height="14px" borderRadius="4px" />
        </div>
      ))}
    </nav>
    <div className="sidebar-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px' }}>
        <AvatarSkeleton size="36px" />
        <div>
          <Skeleton width="50px" height="13px" borderRadius="4px" marginBottom="3px" />
          <Skeleton width="80px" height="11px" borderRadius="4px" />
        </div>
      </div>
    </div>
  </aside>
);

export default Skeleton;
