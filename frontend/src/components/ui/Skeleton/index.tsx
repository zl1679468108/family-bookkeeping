import React from 'react'

/**
 * 通用骨架屏组件
 */
interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  marginBottom?: string
  className?: string
  style?: React.CSSProperties
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  marginBottom = '0',
  className = '',
  style,
}) => (
  <div
    className={`skeleton-shimmer ${className}`.trim()}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius,
      marginBottom,
      ...style,
    }}
  />
)

export const AvatarSkeleton: React.FC<{ size?: string | number }> = ({ size = '40px' }) => (
  <Skeleton width={size} height={size} borderRadius="50%" />
)

export const ButtonSkeleton: React.FC<{ width?: string | number; height?: string | number }> = ({
  width = '80px',
  height = '32px',
}) => <Skeleton width={width} height={height} borderRadius="8px" />

export const InputSkeleton: React.FC<{ width?: string | number }> = ({ width = '100%' }) => (
  <Skeleton width={width} height="40px" borderRadius="8px" />
)

export const TextLineSkeleton: React.FC<{
  width?: string | number
  height?: string | number
  marginBottom?: string
}> = ({ width = '100%', height = '14px', marginBottom = '8px' }) => (
  <Skeleton width={width} height={height} borderRadius="4px" marginBottom={marginBottom} />
)

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
)

export const CardGridSkeleton: React.FC<{ count?: number; columns?: number }> = ({
  count = 6,
  columns = 6,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '12px' }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={{ padding: '14px', background: 'var(--srf)', border: '1px solid var(--bd)', borderRadius: 'var(--rm)', minHeight: '88px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Skeleton width="16px" height="16px" borderRadius="4px" />
          <Skeleton width="55%" height="14px" borderRadius="4px" />
        </div>
        <Skeleton width="70%" height="12px" borderRadius="4px" />
        <Skeleton width="50%" height="11px" borderRadius="4px" />
      </div>
    ))}
  </div>
)

/** 统计卡片骨架屏 —— Dashboard/Admin 页面使用，使用与实际 StatCard 一致的结构 */
export const StatCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const actualCount = Math.min(count, 4)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${actualCount}, 1fr)`, gap: '16px' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="stat-card" style={{ pointerEvents: 'none' }}>
          <div className="stat-card__label">
            <Skeleton width="45%" height="12px" borderRadius="4px" />
          </div>
          <div className="stat-card__value">
            <Skeleton width="70%" height="22px" borderRadius="4px" />
          </div>
          <div className="stat-card__sub">
            <Skeleton width="35%" height="12px" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 表格行骨架屏 —— Admin 交易列表、用户列表使用，使用与实际 data-table 一致的结构 */
export const TableRowsSkeleton: React.FC<{ columns?: number; rows?: number }> = ({ columns = 8, rows = 10 }) => (
  <div style={{ overflowX: 'auto' }}>
    <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          {Array.from({ length: columns }, (_, i) => (
            <th key={i} style={{ width: '100%' }}>
              <Skeleton width={i === 0 ? '60%' : i === columns - 1 ? '50%' : `${100 / columns}%`} height="12px" borderRadius="4px" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, rowIdx) => (
          <tr key={rowIdx}>
            {Array.from({ length: columns }, (_, colIdx) => (
                <td key={colIdx} style={{ textAlign: colIdx === columns - 1 ? 'right' : 'left' }}>
                  <Skeleton width={colIdx === 0 ? '50%' : colIdx === columns - 1 ? '55%' : `${100 / columns}%`} height="14px" borderRadius="4px" />
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default Skeleton
