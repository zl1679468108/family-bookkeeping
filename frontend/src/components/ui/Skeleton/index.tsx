import React from 'react'
import {
  SKELETON_DEFAULT_WIDTH,
  SKELETON_DEFAULT_HEIGHT,
  SKELETON_DEFAULT_RADIUS,
  SKELETON_AVATAR_SIZE,
  SKELETON_BUTTON_WIDTH,
  SKELETON_BUTTON_HEIGHT,
  SKELETON_INPUT_HEIGHT,
  SKELETON_TEXT_LINE_HEIGHT,
  SKELETON_TEXT_LINE_RADIUS,
  SKELETON_TEXT_LINE_GAP,
  skeletonDim,
  skeletonTextLineWidth,
  buildSkeletonClassName
} from '../../../utils/skeleton'

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
  width = SKELETON_DEFAULT_WIDTH,
  height = SKELETON_DEFAULT_HEIGHT,
  borderRadius = SKELETON_DEFAULT_RADIUS,
  marginBottom = '0',
  className = '',
  style,
}) => (
  <div
    className={buildSkeletonClassName({ className })}
    style={{
      width: skeletonDim(width),
      height: skeletonDim(height),
      borderRadius,
      marginBottom,
      ...style,
    }}
  />
)

export const AvatarSkeleton: React.FC<{ size?: string | number }> = ({ size = SKELETON_AVATAR_SIZE }) => (
  <Skeleton width={size} height={size} borderRadius="50%" />
)

export const ButtonSkeleton: React.FC<{ width?: string | number; height?: string | number }> = ({
  width = SKELETON_BUTTON_WIDTH,
  height = SKELETON_BUTTON_HEIGHT,
}) => <Skeleton width={width} height={height} borderRadius={SKELETON_DEFAULT_RADIUS} />

export const InputSkeleton: React.FC<{ width?: string | number }> = ({ width = SKELETON_DEFAULT_WIDTH }) => (
  <Skeleton width={width} height={SKELETON_INPUT_HEIGHT} borderRadius={SKELETON_DEFAULT_RADIUS} />
)

export const TextLineSkeleton: React.FC<{
  width?: string | number
  height?: string | number
  marginBottom?: string
}> = ({
  width = SKELETON_DEFAULT_WIDTH,
  height = SKELETON_TEXT_LINE_HEIGHT,
  marginBottom = SKELETON_TEXT_LINE_GAP,
}) => (
  <Skeleton width={width} height={height} borderRadius={SKELETON_TEXT_LINE_RADIUS} marginBottom={marginBottom} />
)

export const TextParagraphSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div>
    {Array.from({ length: lines }, (_, i) => (
      <TextLineSkeleton
        key={i}
        width={skeletonTextLineWidth(i)}
        marginBottom={i === lines - 1 ? '0' : SKELETON_TEXT_LINE_GAP}
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

/** 页面头部骨架 —— 标题 + 右侧筛选/操作按钮（对齐 .page-header 布局） */
export const PageHeaderSkeleton: React.FC<{
  titleWidth?: string | number
  showFilter?: boolean
  actionWidth?: number
}> = ({ titleWidth = '200px', showFilter = true, actionWidth = 96 }) => (
  <div className="sk-page-header">
    <Skeleton width={titleWidth} height="26px" borderRadius="var(--rs)" />
    <div className="sk-page-header__actions">
      {showFilter && <Skeleton width="160px" height="36px" borderRadius="var(--rs)" />}
      <Skeleton width={actionWidth} height="36px" borderRadius="var(--rs)" />
    </div>
  </div>
)

/** 图表卡片骨架 —— 卡片标题 + 图表占位（对齐 Reports/Budgets 图表卡） */
export const ChartCardSkeleton: React.FC<{ height?: number | string; titleWidth?: string | number }> = ({
  height = 280,
  titleWidth = '35%',
}) => (
  <div className="sk-chart-card">
    <div className="sk-chart-card__head">
      <Skeleton width={titleWidth} height="16px" borderRadius="4px" />
    </div>
    <Skeleton width="100%" height={height} borderRadius="var(--rs)" />
  </div>
)

/** 列表行骨架 —— 图标 + 两行文字 + 右侧金额（对齐交易/成员列表行） */
export const ListRowsSkeleton: React.FC<{
  rows?: number
  showIcon?: boolean
  showAmount?: boolean
}> = ({ rows = 5, showIcon = true, showAmount = true }) => (
  <div className="sk-list">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="sk-list__row">
        {showIcon && <Skeleton width="40px" height="40px" borderRadius="10px" />}
        <div className="sk-list__body">
          <Skeleton width="60%" height="13px" borderRadius="4px" marginBottom="6px" />
          <Skeleton width="35%" height="11px" borderRadius="4px" />
        </div>
        {showAmount && <Skeleton width="64px" height="14px" borderRadius="4px" />}
      </div>
    ))}
  </div>
)

/** 筛选栏骨架 —— 多个筛选输入（对齐 FilterBar） */
export const FilterBarSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="sk-filter-bar">
    {Array.from({ length: fields }, (_, i) => (
      <Skeleton
        key={i}
        width={i === fields - 1 ? '100px' : '150px'}
        height="36px"
        borderRadius="var(--rs)"
      />
    ))}
  </div>
)

/** 表单骨架 —— 字段标签 + 输入框 + 提交按钮（对齐 AddTransaction/Profile 表单） */
export const FormSkeleton: React.FC<{ fields?: number; submitWidth?: number }> = ({
  fields = 4,
  submitWidth = 120,
}) => (
  <div className="sk-form">
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="sk-form__field">
        <Skeleton width="30%" height="12px" borderRadius="4px" marginBottom="8px" />
        <Skeleton width="100%" height="40px" borderRadius="var(--rs)" />
      </div>
    ))}
    <Skeleton width={submitWidth} height="40px" borderRadius="var(--rs)" />
  </div>
)

export default Skeleton
