import React from 'react'
import { cx } from '../../../utils/cx'
import './index.scss'
import { ACTION_LOADING } from '../../../utils/actionCopy'

/**
 * 通用加载转圈 — GlobalModal / 切换账号等共用
 */
export interface SpinnerProps {
  size?: number
  className?: string
  /** 无障碍说明 */
  label?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 16,
  className = '',
  label = ACTION_LOADING,
}) => {
  const cls = cx('ui-spinner', className)
  return (
    <svg
      className={cls}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label={label}
    >
      <circle
        className="ui-spinner__track"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="ui-spinner__head"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default Spinner
