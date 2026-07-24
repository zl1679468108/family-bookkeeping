import React from 'react'
import {
  buildStickyActionBarClassName,
  type StickyActionBarTone,
} from '../../../utils/stickyActionBar'
import './index.scss'

/**
 * StickyActionBar — 页面底部固定操作栏（对齐 Taro StickyActionBar）
 */
export interface StickyActionBarProps {
  children: React.ReactNode
  tone?: StickyActionBarTone
  row?: boolean
  className?: string
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  children,
  tone = 'solid',
  row = true,
  className = '',
}) => {
  const cls = buildStickyActionBarClassName({ tone, row, className })
  return <div className={cls}>{children}</div>
}

export default StickyActionBar
