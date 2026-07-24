import React from 'react'
import { cx } from '../../../utils/cx'
import './index.scss'

/**
 * StickyActionBar — 页面底部固定操作栏（对齐 Taro StickyActionBar）
 */
export interface StickyActionBarProps {
  children: React.ReactNode
  tone?: 'solid' | 'blur'
  row?: boolean
  className?: string
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  children,
  tone = 'solid',
  row = true,
  className = '',
}) => {
  const cls = cx(
    'ui-sticky-actions',
    `ui-sticky-actions--${tone}`,
    row && 'ui-sticky-actions--row',
    className,
  )
  return <div className={cls}>{children}</div>
}

export default StickyActionBar
