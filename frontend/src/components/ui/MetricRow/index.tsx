import React from 'react'
import {
  buildMetricItemClassName,
  buildMetricRowClassName,
  type MetricTone,
} from '../../../utils/metric'
import './index.scss'

/**
 * MetricRow — 横向指标行（报表总收入/总支出等）
 * 与 Taro MetricGrid 的 tone 语义对齐：default | income | expense | accent
 */
export type { MetricTone }

export interface MetricItem {
  label: React.ReactNode
  value: React.ReactNode
  tone?: MetricTone
  key?: string
}

export interface MetricRowProps {
  items: MetricItem[]
  className?: string
  /** 视觉尺寸：md 适合卡片内摘要，lg 适合主指标 */
  size?: 'md' | 'lg'
  /** 是否居中（默认 true，报表摘要场景） */
  centered?: boolean
  style?: React.CSSProperties
}

export const MetricRow: React.FC<MetricRowProps> = ({
  items,
  className = '',
  size = 'lg',
  centered = true,
  style,
}) => {
  return (
    <div
      className={buildMetricRowClassName({ size, centered, className })}
      style={style}
    >
      {items.map((item, index) => (
        <div
          key={item.key ?? (typeof item.label === 'string' ? item.label : index)}
          className={buildMetricItemClassName({
            tone: item.tone,
            prefix: 'metric-row__item',
          })}
        >
          <div className="metric-row__label">{item.label}</div>
          <div className="metric-row__value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export default MetricRow
